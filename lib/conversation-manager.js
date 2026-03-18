"use babel";

import { betaConversationsStartStream } from "@mistralai/mistralai/funcs/betaConversationsStartStream.js";
import { betaConversationsAppendStream } from "@mistralai/mistralai/funcs/betaConversationsAppendStream.js";
import { betaConversationsList } from "@mistralai/mistralai/funcs/betaConversationsList.js";
import { betaConversationsGetMessages } from "@mistralai/mistralai/funcs/betaConversationsGetMessages.js";
import { betaConversationsDelete } from "@mistralai/mistralai/funcs/betaConversationsDelete.js";
import { render } from "atom-ide-markdown-service/dist/renderer";

export class ConversationManager {
  constructor(view) {
    this.view = view;
    this.controller = null;
  }

  async initConversations() {
    const res = await betaConversationsList(this.view.mistral);

    if (!res.ok) {
      console.log("betaConversationsList failed:", res.error);
      return;
    }

    const { value: conversations } = res;
    this.view.conversations = conversations;

    if (conversations.length) {
      const select = this.view.uiHelper.createConversationSelect();

      conversations.forEach((conversation) => {
        const optionEl = this.view.uiHelper.createSelectionOption(
          conversation.id,
          conversation.createdAt,
        );

        select.appendChild(optionEl);
      });

      select.addEventListener("change", async (event) => {
        const conversationId = event.target.value;

        this.view.clearChat(false);

        if (!conversationId) {
          return;
        }

        this.view.conversationId = conversationId;

        const res = await betaConversationsGetMessages(this.view.mistral, {
          conversationId,
        });

        if (res.ok) {
          const { value: result } = res;

          this.view.messageRenderer.renderMessages(
            result.messages.map((message) => ({
              markdown: message.content,
              isUser: message.role === "user",
            })),
          );
        } else {
          console.log("betaConversationsGetMessages failed:", res.error);
        }
      });

      const header = document.createElement("div");
      header.classList.add("header");

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("btn", "btn-warning");
      deleteButton.innerText = "Delete";

      deleteButton.addEventListener("click", async () => {
        const conversationId = this.view.conversationId;
        const index = Array.from(select.options).findIndex(
          (option) => option.value === conversationId,
        );

        if (index !== -1) {
          select.remove(index);
          this.view.clearChat();
        }

        const res = await betaConversationsDelete(this.view.mistral, {
          conversationId,
        });

        if (!res.ok) {
          console.log("betaConversationsDelete failed:", res.error);
        }
      });

      header.appendChild(select);
      header.appendChild(deleteButton);
      this.view.element.prepend(header);
      this.view.select = select;
    }
  }

  stop() {
    this.controller.abort();
  }

  async sendMessageToMistral(messageContent) {
    const userMessage = messageContent;

    if (userMessage) {
      await this.view.messageRenderer.appendMessage(userMessage, true);

      const editor = this.view.inputEditorElement.getModel();
      editor.setText("");

      const model =
        atom.config.get("mistral.CustomModel") ||
        atom.config.get("mistral.Model");

      const customInstructions = `
        ${atom.config.get("mistral.CustomInstructions")}
        If input is code with file path and/or selection coordinates (<span class="hidden-filepath">filePath</span><span class="hidden-selection" style="display: none;">startRow startColumn endRow endColumn</span>) then reply exatly "Code added to context."
        If output is code then include file path and/or selection coordinates (<span class="hidden-filepath">filePath</span><span class="hidden-selection" style="display: none;">startRow startColumn endRow endColumn</span>) before and outside code block.
      `;

      const commonFields = {
        model,
        inputs: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        completionArgs: { responseFormat: { type: "text" } },
      };

      let loadingElem = this.view.uiHelper.createLoadingElement();
      this.view.messagesArea.appendChild(loadingElem);

      this.controller = new AbortController();
      const stopButton = this.view.uiHelper.createStopButton();
      this.view.messagesFooter.prepend(stopButton);

      const commonOptions = {
        fetchOptions: { signal: this.controller.signal },
      };

      try {
        let response;

        if (this.view.conversationId) {
          response = await betaConversationsAppendStream(
            this.view.mistral,
            {
              conversationId: this.view.conversationId,
              conversationAppendStreamRequest: commonFields,
            },
            commonOptions,
          );
        } else {
          response = await betaConversationsStartStream(
            this.view.mistral,
            {
              instructions: customInstructions,
              ...commonFields,
            },
            commonOptions,
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const botMessageElement = await this.view.messageRenderer.appendMessage(
          "",
          false,
        );

        let response_string = "";
        const { value: result } = response;

        for await (const event of result) {
          if (!this.view.conversationId) {
            const newOption = this.view.uiHelper.createSelectionOption(
              event.data?.conversationId,
              new Date(),
            );

            newOption.selected = true;

            this.view.select.insertBefore(
              newOption,
              this.view.select.options[0].nextSibling,
            );
          }

          this.view.conversationId =
            event.data?.conversationId || this.view.conversationId;

          const content = event.data?.content;

          if (!content) continue;

          response_string += content;

          try {
            render(response_string)
              .then((renderedHTML) => {
                this.view.messageRenderer.updateMessage(
                  botMessageElement,
                  renderedHTML,
                );
              })
              .catch((e) => console.error("Markdown rendering error:", e));
          } catch (e) {
            console.error("Markdown rendering error:", e);
          }
        }

        this.view.messageRenderer.messages.push({
          markdown: response_string,
          isUser: false,
        });

        this.view.codeBlockHandler.handleCodeBlocks(botMessageElement);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Error in sending message to Mistral:", error);

        atom.notifications.addError("Mistral Error", {
          detail:
            "Unable to get a response from Mistral. Please check your API key and internet connection.",
          dismissable: true,
        });
      } finally {
        loadingElem.remove();
        stopButton.remove();
      }
    }
  }
}

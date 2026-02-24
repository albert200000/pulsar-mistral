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
  }

  createSelectionOption(conversationId, createdAt) {
    const optionEl = document.createElement("option");
    optionEl.value = conversationId;
    optionEl.textContent = `Conversation - ${createdAt.toISOString().replace("T", " ").slice(0, -5)}`;

    if (conversationId === this.view.conversationId) {
      optionEl.selected = true;
    }

    return optionEl;
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
      const select = document.createElement("select");
      select.classList.add("input-select");
      const optionEl = document.createElement("option");
      optionEl.textContent = "Select conversation";
      optionEl.value = "";
      select.appendChild(optionEl);

      conversations.forEach((conversation) => {
        const optionEl = this.createSelectionOption(
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

  async sendMessageToMistral(messageContent) {
    const userMessage = messageContent;

    if (userMessage) {
      await this.view.messageRenderer.updateMessagesArea(userMessage, true);

      const editor = this.view.inputEditorElement.getModel();
      editor.setText("");

      const model =
        atom.config.get("mistral.CustomModel") ||
        atom.config.get("mistral.Model");

      const customInstructions = `
        ${atom.config.get("mistral.CustomInstructions")}
        If input is code with file path and/or selection coordinates (\`File: path/here\` \`Selection: start, end, start, end\`) and no other text then reply exatly "Code added to context."
        If output is code then include file path and/or selection coordinates (\`File: path/here\` \`Selection: start, end, start, end\`) before code output.
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

      try {
        let response;

        if (this.view.conversationId) {
          response = await betaConversationsAppendStream(this.view.mistral, {
            conversationId: this.view.conversationId,
            conversationAppendStreamRequest: commonFields,
          });
        } else {
          response = await betaConversationsStartStream(this.view.mistral, {
            instructions: customInstructions,
            ...commonFields,
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const botMessageElement =
          await this.view.messageRenderer.createMessageElement("", false);

        this.view.messagesArea.appendChild(botMessageElement);
        let response_string = "";
        const { value: result } = response;

        for await (const event of result) {
          if (!this.view.conversationId) {
            const newOption = this.createSelectionOption(
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
                botMessageElement.innerHTML = renderedHTML;
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
        console.error("Error in sending message to Mistral:", error);

        atom.notifications.addError("Mistral Error", {
          detail:
            "Unable to get a response from Mistral. Please check your API key and internet connection.",
          dismissable: true,
        });
      }
    }
  }
}

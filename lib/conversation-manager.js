"use babel";

import { render } from "atom-ide-markdown-service/dist/renderer";
import MistralApi from "./mistral-api";
import { ConversationSelect } from "./components/conversation-select";
import { MessagesArea } from "./components/messages-area";
import { MessagesFooter } from "./components/messages-footer";
import { InputEditor } from "./components/input-editor";

export class ConversationManager {
  constructor(view) {
    this.view = view;
    this.controller = null;
  }

  stop() {
    if (this.controller) {
      this.controller.abort();
    }
  }

  async sendMessageToMistral(messageContent) {
    const userMessage = messageContent;

    if (userMessage) {
      await this.view.messageRenderer.appendMessage(userMessage, true);

      InputEditor.clear();

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

      MessagesArea.enableLoading();
      MessagesFooter.showStopButton();

      this.controller = new AbortController();

      const commonOptions = {
        fetchOptions: { signal: this.controller.signal },
      };

      try {
        let response;

        if (ConversationSelect.getConversationId()) {
          response = await MistralApi.appendStream(
            ConversationSelect.getConversationId(),
            commonFields,
            commonOptions,
          );
        } else {
          response = await MistralApi.startStream(
            customInstructions,
            commonFields,
            commonOptions,
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const botMessageIndex = await this.view.messageRenderer.appendMessage(
          "",
          false,
        );

        let response_string = "";
        const { value: result } = response;

        for await (const event of result) {
          if (!ConversationSelect.getConversationId()) {
            ConversationSelect.reinit(event.data?.conversationId);
          }

          this.view.conversationId =
            event.data?.conversationId || this.view.conversationId;

          const content = event.data?.content;

          if (!content) continue;

          response_string += content;

          try {
            const renderedHTML = await render(response_string);
            MessagesArea.updateMessage(botMessageIndex, renderedHTML);
          } catch (e) {
            console.error("Markdown rendering error:", e);
          }
        }

        this.view.messageRenderer.messages.push({
          markdown: response_string,
          isUser: false,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error in sending message to Mistral:", error);
          atom.notifications.addError("Mistral Error", {
            detail:
              "Unable to get a response from Mistral. Please check your API key and internet connection.",
            dismissable: true,
          });
        }
      } finally {
        MessagesFooter.hideStopButton();
        MessagesArea.disableLoading();
        this.controller = null;
      }
    }
  }
}

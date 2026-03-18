"use babel";

import m from "mithril";

export class UIHelper {
  constructor(view) {
    this.view = view;
  }

  createMessagesArea() {
    return {
      view: () => m("div.mistral-messages-container"),
    };
  }

  createClearChatButton() {
    return {
      view: () =>
        m(
          "button.btn.mistral-clear-chat-btn",
          {
            onclick: () => this.view.clearChat(),
          },
          "Clear Chat",
        ),
    };
  }

  createStopButton() {
    return {
      view: () =>
        m(
          "button.btn.mistral-stop-btn",
          {
            onclick: () => this.view.conversationManager.stop(),
          },
          "Stop Response",
        ),
    };
  }

  createInputEditor() {
    return {
      oncreate: ({ dom }) => {
        const editorModel = dom.getModel();
        const lineNumberGutter = editorModel.gutterWithName("line-number");
        if (lineNumberGutter) lineNumberGutter.hide();

        dom.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey) {
              editorModel.insertNewline();
            } else {
              this.view.handleSendButtonClick();
            }
          }
        });
      },
      view: () =>
        m("atom-text-editor.mistral-input-area", {
          "placeholder-text": "Message",
        }),
    };
  }

  createSendButton(onClick) {
    return {
      view: () =>
        m(
          "button.btn.btn-primary.mistral-send-btn",
          {
            onclick: onClick,
          },
          "Send",
        ),
    };
  }

  createLoadingElement() {
    return {
      view: () => m("span.messages-loading.loading.loading-spinner-small"),
    };
  }
}

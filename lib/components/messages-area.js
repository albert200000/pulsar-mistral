"use babel";

import m from "mithril";

const state = {
  loading: false,
  messages: [],
};

export class MessagesArea {
  static messagesArea = null;

  static enableLoading() {
    state.loading = true;
    m.redraw();
  }

  static disableLoading() {
    state.loading = false;
    m.redraw();
  }

  static appendMessage(html, isUser, scroll) {
    state.messages.push({ html, isUser });
    m.redraw();

    if (scroll) {
      setTimeout(() => {
        this.messagesArea.scrollTo({
          top: this.messagesArea.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    }

    return state.messages.length - 1;
  }

  static updateMessage(messageIndex, html) {
    state.messages[messageIndex].html = html;
    m.redraw();
  }

  static clearMessages() {
    state.messages = [];
  }

  view({ attrs }) {
    return m(
      "div.mistral-messages-container",
      {
        oncreate: ({ dom }) => (MessagesArea.messagesArea = dom),
      },
      [
        state.loading &&
          m("span.messages-loading.loading.loading-spinner-small"),
        state.messages.map(({ html, isUser }, idx) =>
          m(`div.chat-message.${isUser ? "user-message" : "mistral-message"}`, {
            key: idx,
            oncreate: ({ dom }) => {
              dom.innerHTML = html;
              attrs.view.codeBlockHandler.handleCodeBlocks(dom, isUser);
            },
            onupdate: ({ dom }) => {
              dom.innerHTML = html;
              attrs.view.codeBlockHandler.handleCodeBlocks(dom, isUser);
            },
          }),
        ),
      ],
    );
  }
}

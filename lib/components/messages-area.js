"use babel";

import m from "mithril";

const state = {
  loading: false,
  messages: [],
};

export class MessagesArea {
  static enableLoading() {
    state.loading = true;
    m.redraw();
  }

  static disableLoading() {
    state.loading = false;
    m.redraw();
  }

  static appendMessage(html, isUser) {
    state.messages.push({ html, isUser });
    m.redraw();

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
    return m("div.mistral-messages-container", [
      state.loading && m("span.messages-loading.loading.loading-spinner-small"),
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
    ]);
  }
}

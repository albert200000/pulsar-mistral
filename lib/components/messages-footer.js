"use babel";

import m from "mithril";

const state = {
  stopVisible: false,
};

export class MessagesFooter {
  static showStopButton() {
    state.stopVisible = true;
    m.redraw();
  }

  static hideStopButton() {
    state.stopVisible = false;
    m.redraw();
  }

  view({ attrs }) {
    return m("div", [
      state.stopVisible &&
        m(
          "button.btn.mistral-stop-btn",
          {
            onclick: () => attrs.view.conversationManager.stop(),
          },
          "Stop Response",
        ),
      ,
      m(
        "button.btn.mistral-clear-chat-btn",
        {
          onclick: () => attrs.view.clearChat(),
        },
        "Clear Chat",
      ),
    ]);
  }
}

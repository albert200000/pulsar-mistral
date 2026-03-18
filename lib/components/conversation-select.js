"use babel";

import m from "mithril";
import MistralApi from "../mistral-api";

const SelectOption = {
  view: ({ attrs }) =>
    m(
      "option",
      {
        value: attrs.conversationId,
        selected: attrs.conversationId === attrs.view.conversationId,
      },
      `Conversation - ${attrs.createdAt.toISOString().replace("T", " ").slice(0, -5)}`,
    ),
};

const DeleteButton = {
  view: ({ attrs }) =>
    m(
      "button.btn.btn-warning",
      {
        onclick: async () => {
          const conversationId = attrs.view.conversationId;
          attrs.view.clearChat();

          const res = await MistralApi.deleteConversation(conversationId);

          if (!res.ok) {
            console.log("betaConversationsDelete failed:", res.error);
          } else {
            ConversationSelect.refresh();
          }
        },
      },
      "Delete",
    ),
};

const state = {
  conversations: [],
  inited: false,
};

export class ConversationSelect {
  static refresh() {
    state.inited = false;
    m.redraw();
  }

  async onChange(event, attrs) {
    const conversationId = event.target.value;
    attrs.view.clearChat(false);

    if (!conversationId) {
      return;
    }

    attrs.view.conversationId = conversationId;

    const res = await MistralApi.getConversationMessages(conversationId);

    if (res.ok) {
      const { value: result } = res;
      attrs.view.messageRenderer.renderMessages(
        result.messages.map((message) => ({
          markdown: message.content,
          isUser: message.role === "user",
        })),
      );
    } else {
      console.log("betaConversationsGetMessages failed:", res.error);
    }
  }

  async oninit() {
    if (state.inited) return;

    state.inited = true;
    state.conversations = await MistralApi.initConversations();
    m.redraw();
  }

  view({ attrs }) {
    return m("div.header", [
      m(
        "select.input-select",
        {
          onchange: (event) => this.onChange(event, attrs),
        },
        [
          m("option", { value: "" }, "Select conversation"),
          state.conversations.map((conversation) =>
            m(SelectOption, {
              conversationId: conversation.id,
              createdAt: conversation.createdAt,
              view: attrs.view,
            }),
          ),
        ],
      ),
      m(DeleteButton, { attrs }),
    ]);
  }
}

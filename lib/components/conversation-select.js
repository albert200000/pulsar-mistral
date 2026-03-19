"use babel";

import m from "mithril";
import MistralApi from "../mistral-api";

const state = {
  conversations: [],
  conversationId: "",
  inited: false,
};

const SelectOption = {
  view: ({ attrs }) =>
    m(
      "option",
      {
        value: attrs.conversationId,
        selected: attrs.conversationId === state.conversationId,
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
            ConversationSelect.reinit();
          }
        },
      },
      "Delete",
    ),
};

export class ConversationSelect {
  static async reinit(conversationId = "") {
    state.conversationId = conversationId;
    state.conversations = await MistralApi.initConversations();
    m.redraw();
  }

  static resetSelected() {
    state.conversationId = "";
  }

  static getConversationId() {
    return state.conversationId;
  }

  async onChange(event, attrs) {
    const conversationId = event.target.value;
    attrs.view.clearChat(false);
    state.conversationId = conversationId;

    if (!conversationId) {
      return;
    }

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

  async oninit({ attrs }) {
    if (state.inited) return;

    state.inited = true;
    state.conversationId = attrs.view.serializedState.conversationId;
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
            }),
          ),
        ],
      ),
      m(DeleteButton, attrs),
    ]);
  }
}

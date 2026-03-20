"use babel";

import { MessageRenderer } from "./message-renderer";
import { ConversationManager } from "./conversation-manager";
import { CodeBlockHandler } from "./code-block-handler";
import { ConversationSelect } from "./components/conversation-select";
import { MessagesArea } from "./components/messages-area";
import { MessagesFooter } from "./components/messages-footer";
import { InputEditor } from "./components/input-editor";
import m from "mithril";

export default class MistralView {
  constructor(serializedState) {
    this.serializedState = serializedState || {
      messages: [],
      conversationId: "",
    };

    this.messageRenderer = new MessageRenderer(this);
    this.conversationManager = new ConversationManager(this);
    this.codeBlockHandler = new CodeBlockHandler(this);
  }

  oninit() {
    // Render messages if available
    if (this.serializedState && this.serializedState.messages) {
      this.messageRenderer.renderMessages(this.serializedState.messages);
    }
  }

  view() {
    return m("div.mistral-pane-item", [
      m(ConversationSelect, { view: this }),
      m(MessagesArea, { view: this }),
      m(MessagesFooter, { view: this }),
      m(InputEditor, { view: this }),
    ]);
  }

  getTitle() {
    return "Mistral";
  }

  getElement() {
    if (!this.element) {
      this.element = document.createElement("div");
      m.mount(this.element, this);
    }

    return this.element;
  }

  serialize() {
    return {
      messages: this.messageRenderer.messages,
      conversationId: ConversationSelect.getConversationId(),
    };
  }

  clearChat(clearSelect = true) {
    this.messageRenderer.messages = [];
    this.conversationId = null;
    this.serializedState = { messages: [], conversationId: null };
    MessagesArea.clearMessages();

    if (clearSelect) ConversationSelect.resetSelected();
  }
}

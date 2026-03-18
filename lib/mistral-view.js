"use babel";

import { UIHelper } from "./ui-helper";
import { MessageRenderer } from "./message-renderer";
import { ConversationManager } from "./conversation-manager";
import { CodeBlockHandler } from "./code-block-handler";
import { ConversationSelect } from "./components/conversation-select";
import m from "mithril";

export default class MistralView {
  constructor(serializedState) {
    this.serializedState = serializedState || {
      messages: [],
      conversationId: null,
    };

    this.conversationId = this.serializedState.conversationId;
    this.chatFunction = null;
    this.inputEditor = null;

    this.uiHelper = new UIHelper(this);
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
      m(this.uiHelper.createMessagesArea(), {
        oncreate: ({ dom }) => (this.messagesArea = dom),
      }),
      m(this.uiHelper.createClearChatButton()),
      m("div.mistral-input-container", [
        m(this.uiHelper.createInputEditor(), {
          oncreate: ({ dom }) => {
            this.inputEditorElement = dom;
          },
        }),
        m(
          this.uiHelper.createSendButton(this.handleSendButtonClick.bind(this)),
        ),
      ]),
    ]);
  }

  async handleSendButtonClick() {
    if (!this.inputEditorElement) return;

    const editor = this.inputEditorElement.getModel();
    const message = editor.getText().trim();

    if (message) {
      try {
        await this.conversationManager.sendMessageToMistral(message);
      } catch (err) {
        console.error(err);
      }
    }
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
    return this.messageRenderer.serialize();
  }

  clearChat(clearSelect = true) {
    this.messageRenderer.messages = [];
    this.conversationId = null;
    this.serializedState = { messages: [], conversationId: null };

    if (this.select && clearSelect) this.select.selectedIndex = 0;

    m.redraw();
  }

  setChatFunction(chatFunction) {
    this.chatFunction = chatFunction;
  }
}

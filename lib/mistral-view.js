"use babel";

import { MistralCore } from "@mistralai/mistralai/core.js";
import { UIHelper } from "./ui-helper";
import { MessageRenderer } from "./message-renderer";
import { ConversationManager } from "./conversation-manager";
import { CodeBlockHandler } from "./code-block-handler";

export default class MistralView {
  constructor(serializedState) {
    this.serializedState = serializedState || {
      messages: [],
      conversationId: null,
    };

    this.conversations = [];
    this.conversationId = this.serializedState.conversationId;
    this.chatFunction = null;

    // Initialize helper classes
    this.uiHelper = new UIHelper(this);
    this.messageRenderer = new MessageRenderer(this);
    this.conversationManager = new ConversationManager(this);
    this.codeBlockHandler = new CodeBlockHandler(this);

    // Setup UI
    this.element = this.uiHelper.createRootElement();
    this.messagesArea = this.uiHelper.createMessagesArea(this.element);
    this.uiHelper.setupClearChatButton(this.element);
    this.inputContainer = this.uiHelper.createInputContainer(this.element);

    this.inputEditorElement = this.uiHelper.createInputEditor(
      this.inputContainer,
    );

    this.uiHelper.setupInputEditor(this.inputEditorElement);

    this.sendButton = this.uiHelper.createSendButton(
      this.inputContainer,
      this.handleSendButtonClick.bind(this),
    );

    // Render messages if available
    if (serializedState && serializedState.messages) {
      this.messageRenderer.renderMessages(serializedState.messages);
    }

    // Initialize Mistral core
    this.mistral = new MistralCore({
      apiKey: process.env["MISTRAL_API_KEY"] ?? "",
    });

    // Initialize conversations
    this.conversationManager.initConversations();
  }

  async handleSendButtonClick() {
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
    return this.element;
  }

  serialize() {
    return this.messageRenderer.serialize();
  }

  clearChat(clearSelect = true) {
    this.messagesArea.innerHTML = "";
    this.conversationId = null;
    this.serializedState = { messages: [], conversationId: null };
    this.messageRenderer.messages = [];

    if (this.select && clearSelect) this.select.selectedIndex = 0;
  }

  setChatFunction(chatFunction) {
    this.chatFunction = chatFunction;
  }
}

"use babel";

import { render } from "atom-ide-markdown-service/dist/renderer";

export class MessageRenderer {
  constructor(view) {
    this.view = view;
  }

  async renderMessage(message) {
    try {
      return await render(message);
    } catch (e) {
      console.error("Markdown rendering error:", e);
      return "";
    }
  }

  renderMessages(messages) {
    this.view.messagesArea.innerHTML = "";

    messages.forEach(async ({ htmlContent, isUser }) => {
      this.view.messagesArea.appendChild(
        await this.createMessageElement(htmlContent, isUser),
      );
    });
  }

  async createMessageElement(htmlContent, isUser) {
    const html = await this.renderMessage(htmlContent);
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = html;

    if (isUser) {
      messageElement.classList.add("user-message");
    } else {
      messageElement.classList.add("mistral-message");
    }

    await this.view.codeBlockHandler.handleCodeBlocks(messageElement);

    return messageElement;
  }

  async updateMessagesArea(message, isUser) {
    await this.createMessageElement(message, isUser);
    this.view.messagesArea.appendChild(messageElement);
  }

  clearChatHistory() {
    this.view.messagesArea.innerHTML = "";
    this.view.conversationId = null;
    this.view.serializedState = { messages: [], conversationId: null };

    if (this.view.select) this.view.select.selectedIndex = 0;
  }

  serialize() {
    if (!this.view.messagesArea) return { messages: [] };

    const messages = Array.from(
      this.view.messagesArea.querySelectorAll(".chat-message"),
    ).map((el) => ({
      htmlContent: el.innerHTML,
      isUser: el.classList.contains("user-message"),
    }));

    return { messages, conversationId: this.view.conversationId };
  }
}

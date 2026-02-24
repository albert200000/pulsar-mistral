"use babel";

import { render } from "atom-ide-markdown-service/dist/renderer";

export class MessageRenderer {
  constructor(view) {
    this.view = view;
    this.messages = [];
  }

  async renderMessage(message) {
    try {
      return await render(message);
    } catch (e) {
      console.error("Markdown rendering error:", e);
      return "";
    }
  }

  async renderMessages(messages) {
    this.view.messagesArea.innerHTML = "";

    for (const { markdown, isUser } of messages) {
      this.view.messagesArea.appendChild(
        await this.createMessageElement(markdown, isUser),
      );
    }
  }

  async createMessageElement(markdown, isUser) {
    const html = await this.renderMessage(markdown);
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = html;

    if (isUser) {
      messageElement.classList.add("user-message");
    } else {
      messageElement.classList.add("mistral-message");
    }

    this.messages.push({ markdown, isUser });

    await this.view.codeBlockHandler.handleCodeBlocks(messageElement);

    return messageElement;
  }

  async updateMessagesArea(message, isUser) {
    const messageElement = await this.createMessageElement(message, isUser);
    this.view.messagesArea.appendChild(messageElement);
  }

  serialize() {
    return {
      messages: this.messages,
      conversationId: this.view.conversationId,
    };
  }
}

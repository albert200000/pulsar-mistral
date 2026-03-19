"use babel";

import { render } from "atom-ide-markdown-service/dist/renderer";
import { MessagesArea } from "./components/messages-area";

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
    this.messages = [];

    for (const { markdown, isUser } of messages) {
      await this.appendMessage(markdown, isUser, false);
    }
  }

  async appendMessage(message, isUser, scroll = true) {
    this.messages.push({ markdown: message, isUser });

    const html = await this.renderMessage(message);
    const messageIndex = MessagesArea.appendMessage(html, isUser);

    if (scroll) {
      setTimeout(() => {
        this.view.messagesArea.scrollTo({
          top: this.view.messagesArea.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    }

    return messageIndex;
  }
}

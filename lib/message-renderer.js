"use babel";

import { render } from "atom-ide-markdown-service/dist/renderer";

export class MessageRenderer {
  constructor(view) {
    this.view = view;
  }

  renderMessages(messages) {
    this.view.messagesArea.innerHTML = "";

    messages.forEach(({ markdown, htmlContent, isUser }) => {
      if (markdown) {
        render(markdown)
          .then((renderedHTML) => {
            this.view.messagesArea.appendChild(
              this.createMessageElement(renderedHTML, isUser, markdown),
            );
          })
          .catch((e) => console.error("Markdown rendering error:", e));
      } else {
        this.view.messagesArea.appendChild(
          this.createMessageElement(htmlContent, isUser),
        );
      }
    });
  }

  createMessageElement(htmlContent, isUser, markdown = null) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = htmlContent;

    if (markdown) messageElement.setAttribute("data-markdown", markdown);

    if (isUser) {
      messageElement.classList.add("user-message");
    } else {
      messageElement.classList.add("mistral-message");
    }

    return messageElement;
  }

  updateMessagesArea(message, isUser) {
    const messageElement = this.createMessageElement(message, isUser);
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
      markdown: el.getAttribute("data-markdown"),
      isUser: el.classList.contains("user-message"),
    }));

    return { messages, conversationId: this.view.conversationId };
  }
}

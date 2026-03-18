"use babel";

import { render } from "atom-ide-markdown-service/dist/renderer";
import m from "mithril";

export class MessageRenderer {
  constructor(view) {
    this.view = view;
    this.messages = [];
    this.messageComponents = [];
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
    this.messageComponents = [];

    for (const { markdown, isUser } of messages) {
      await this.appendMessage(markdown, isUser, false);
    }

    m.redraw();
  }

  createMessageComponent(markdown, isUser) {
    return {
      view: async () => {
        const html = await this.renderMessage(markdown);
        return m(
          `div.chat-message.${isUser ? "user-message" : "mistral-message"}`,
          {
            oncreate: ({ dom }) => {
              dom.innerHTML = html;
              this.view.codeBlockHandler.handleCodeBlocks(dom, isUser);
            },
            onupdate: ({ dom }) => {
              dom.innerHTML = html;
              this.view.codeBlockHandler.handleCodeBlocks(dom, isUser);
            },
          },
        );
      },
    };
  }

  async appendMessage(message, isUser, scroll = true) {
    this.messages.push({ markdown: message, isUser });

    const component = this.createMessageComponent(message, isUser);
    this.messageComponents.push(component);

    if (scroll) {
      setTimeout(() => {
        this.view.messagesArea.scrollTo({
          top: this.view.messagesArea.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    }

    m.redraw();

    return component;
  }

  updateMessage(messageComponent, messageHtml) {
    // In Mithril, we don't directly update the DOM
    // Instead, we would update the component's state and let Mithril handle the update
    // For this case, we'll need to find the message in our array and update it
    // Then trigger a redraw
    m.redraw();
  }

  getMessagesView() {
    return {
      view: () => this.messageComponents.map((component) => m(component)),
    };
  }

  serialize() {
    return {
      messages: this.messages,
      conversationId: this.view.conversationId,
    };
  }
}

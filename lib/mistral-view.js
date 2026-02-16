"use babel";

import { MistralCore } from "@mistralai/mistralai/core.js";
import { chatStream } from "@mistralai/mistralai/funcs/chatStream.js";
import { render } from "atom-ide-markdown-service/dist/renderer";

export default class MistralView {
  handleSendButtonClick() {
    // Retrieve text from atom-text-editor
    const editor = this.inputEditorElement.getModel();
    const message = editor.getText().trim();

    if (message) {
      this.sendMessageToMistral(message);
      editor.setText(""); // Clear the editor after sending the message
    }
  }

  constructor(serializedState) {
    this.serializedState = serializedState || { messages: [] };

    // Root element should use the same classes for consistent styling
    this.element = document.createElement("div");
    this.element.classList.add("mistral-pane-item");

    // Message area
    this.messagesArea = document.createElement("div");
    this.messagesArea.classList.add("mistral-messages-container");
    this.element.appendChild(this.messagesArea);

    // Clear chat button
    const clearChatButton = document.createElement("button");
    clearChatButton.classList.add("btn", "mistral-clear-chat-btn");
    clearChatButton.textContent = "Clear Chat";
    clearChatButton.addEventListener("click", () => {
      this.clearChatHistory();
    });
    this.element.appendChild(clearChatButton);

    // Input container
    this.inputContainer = document.createElement("div");
    this.inputContainer.classList.add("mistral-input-container");
    this.element.appendChild(this.inputContainer);

    // Input area
    this.inputEditorElement = document.createElement("atom-text-editor");
    this.inputEditorElement.setAttribute("placeholder-text", "Message");
    this.inputEditorElement.classList.add("mistral-input-area");
    this.inputContainer.appendChild(this.inputEditorElement);

    // Ensure the editor is fully loaded before configuring
    setImmediate(() => {
      const editorModel = this.inputEditorElement.getModel();
      const lineNumberGutter = editorModel.gutterWithName("line-number");
      if (lineNumberGutter) {
        lineNumberGutter.hide();
      }
    });

    // Send button
    this.sendButton = document.createElement("button");
    this.sendButton.classList.add("btn", "btn-primary", "mistral-send-btn");
    this.sendButton.textContent = "Send";
    this.sendButton.addEventListener("click", () => {
      this.handleSendButtonClick();
    });
    this.inputContainer.appendChild(this.sendButton);

    if (serializedState && serializedState.messages) {
      serializedState.messages.forEach(({ markdown, htmlContent, isUser }) => {
        if (markdown) {
          // If markdown is available, render it
          render(markdown)
            .then((renderedHTML) => {
              this.messagesArea.appendChild(
                this.createMessageElement(renderedHTML, isUser, markdown),
              );
            })
            .catch((e) => {
              console.error("Markdown rendering error:", e);
            });
        } else {
          // If only HTML content is available, use it directly
          this.messagesArea.appendChild(
            this.createMessageElement(htmlContent, isUser),
          );
        }
      });
    }

    this.mistral = new MistralCore({
      apiKey: process.env["MISTRAL_API_KEY"] ?? "",
    });
  }

  async sendMessageToMistral(messageContent) {
    const userMessage = messageContent;
    if (userMessage) {
      // Create a message element for the user's input and add it to the messages area
      this.updateMessagesArea(userMessage, true);

      // Clear the text from the atom-text-editor model
      const editor = this.inputEditorElement.getModel();
      editor.setText("");

      // Set up the API request data
      const model =
        atom.config.get("mistral.CustomModel") ||
        atom.config.get("mistral.Model");
      const customInstructions = atom.config.get("mistral.CustomInstructions");

      try {
        const response = await chatStream(this.mistral, {
          model,
          messages: [
            {
              content: userMessage,
              role: "user",
            },
            {
              role: "system",
              content: customInstructions,
            },
          ],
          responseFormat: {
            type: "text",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Create an initial message element for the bot's response with empty content
        const botMessageElement = this.createMessageElement("", false);
        this.messagesArea.appendChild(botMessageElement);
        var response_string = "";
        const { value: result } = response;

        for await (const event of result) {
          const content = event.data?.choices[0]?.delta.content;
          if (!content) {
            continue;
          }

          response_string += content;

          // Update the bot's message element with the new content
          try {
            render(response_string)
              .then((renderedHTML) => {
                botMessageElement.innerHTML = renderedHTML;
              })
              .catch((e) => {
                console.error("Markdown rendering error:", e);
              });
          } catch (e) {
            console.error("Markdown rendering error:", e);
          }
        }

        try {
          this.handleCodeBlocks(botMessageElement);
        } catch (error) {
          console.error("Error in rendering code blocks", error);
        }
      } catch (error) {
        console.error("Error in sending message to Mistral:", error);
        atom.notifications.addError("Mistral Error", {
          detail:
            "Unable to get a response from Mistral. Please check your API key and internet connection.",
          dismissable: true,
        });
      }
    }
  }

  createCopyButton(editor) {
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy Code";
    copyButton.classList.add("copy-code-button");

    copyButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation(); // Prevent bubbling
        atom.clipboard.write(editor.getText());
        copyButton.textContent = "Copied!";
        setTimeout(() => (copyButton.textContent = "Copy Code"), 2000); // Reset button text after 2 seconds
      },
      { once: true },
    );

    return copyButton;
  }

  grammarForLanguage(lang) {
    // direct by common keys
    const lower = (lang || "").toLowerCase();
    // try name, fileTypes, scopeName matches
    for (const g of atom.grammars.getGrammars()) {
      if (g.scopeName === lower) return g;
      if (g.name && g.name.toLowerCase() === lower) return g;
      if (g.fileTypes && g.fileTypes.includes(lower)) return g;
      // also match common labels like "language-javascript" -> "javascript"
      if (g.name && lower === g.name.toLowerCase().replace(/^language-/, ""))
        return g;
    }
    // try grammarForScopeName with common guesses
    return (
      atom.grammars.grammarForScopeName(`source.${lower}`) ||
      atom.grammars.grammarForScopeName(`text.${lower}.basic`) ||
      null
    );
  }

  insertReadOnlyEditor(containerEl, codeText, grammar) {
    // create an in-memory TextEditor
    const editor = atom.workspace.buildTextEditor({});
    editor.setText(codeText);
    editor.setGrammar(grammar);

    // configure read-only appearance/behavior
    editor.setReadOnly(true);

    editor.element.style.fontSize = "12px";

    // insert editor's DOM node into container
    // editor.element is a TextEditorElement
    containerEl.innerHTML = ""; // replace existing content
    containerEl.appendChild(editor.element);

    return editor;
  }

  handleCodeBlocks(containerElement) {
    const codeBlocks = containerElement.querySelectorAll("pre code");

    codeBlocks.forEach((codeBlock) => {
      const codeContainer = document.createElement("div");
      codeContainer.classList.add("code-container");

      // Create the container for the language label and copy button
      const codeCopyContainer = document.createElement("div");
      codeCopyContainer.classList.add("code-copy-container");

      const lang = codeBlock.className.slice("language-".length) || "text";
      const grammar = this.grammarForLanguage(lang);
      const languageLabel = document.createElement("span");
      languageLabel.classList.add("code-language-label");
      languageLabel.textContent = "<> " + lang;
      const text = codeBlock.textContent;
      const editor = this.insertReadOnlyEditor(codeBlock, text, grammar);
      const copyButton = this.createCopyButton(editor);

      // Append the label and button to the codeCopyContainer
      codeCopyContainer.appendChild(languageLabel);
      codeCopyContainer.appendChild(copyButton);

      // Insert the codeCopyContainer into the codeContainer before the code block
      codeContainer.appendChild(codeCopyContainer);

      const preElement = codeBlock.parentNode;
      preElement.parentNode.insertBefore(codeContainer, preElement);
      codeContainer.appendChild(preElement);
    });
  }

  clearChatHistory() {
    // Clear the messages from the messages area
    this.messagesArea.innerHTML = "";

    // Ensure serializedState is an object with a messages array before trying to clear it
    if (!this.serializedState) {
      this.serializedState = { messages: [] };
    } else {
      this.serializedState.messages = [];
    }
  }

  updateMessagesAreaMarkdown(markdown, isUser) {
    render(markdown)
      .then((html) => {
        // Create a new message element with the rendered HTML and the original markdown
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.innerHTML = html; // Set the rendered HTML content
        messageElement.setAttribute("data-markdown", markdown); // Save the original markdown

        // Add classes based on the sender
        if (isUser) {
          messageElement.classList.add("user-message");
        } else {
          messageElement.classList.add("mistral-message");
        }

        // Insert the message element into the messages area
        this.messagesArea.appendChild(messageElement);

        // Add copy buttons to any code elements within the message
        const codeElements = messageElement.querySelectorAll("code");
        codeElements.forEach((codeElement) => {
          // For each code tag found, create and insert a copy button
          const copyButton = this.createCopyButton(codeElement);
          codeElement.parentNode.insertBefore(
            copyButton,
            codeElement.nextSibling,
          ); // Insert after the code element
        });
      })
      .catch((e) => {
        console.error("Markdown rendering error:", e);
      });
  }

  // Add this helper method to create a message element
  createMessageElement(htmlContent, isUser, markdown = null) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = htmlContent;

    if (markdown) {
      messageElement.setAttribute("data-markdown", markdown);
    }

    if (isUser) {
      messageElement.classList.add("user-message");
    } else {
      messageElement.classList.add("mistral-message");
    }

    return messageElement;
  }

  getTitle() {
    return "Mistral";
  }

  serialize() {
    if (!this.messagesArea) {
      return { messages: [] };
    }

    const messages = Array.from(
      this.messagesArea.querySelectorAll(".chat-message"),
    ).map((messageElement) => {
      return {
        htmlContent: messageElement.innerHTML,
        markdown: messageElement.getAttribute("data-markdown"),
        isUser: messageElement.classList.contains("user-message"),
      };
    });

    return { messages };
  }

  updateMessagesArea(message, isUser) {
    const messageElement = this.createMessageElement(message, isUser);
    this.messagesArea.appendChild(messageElement);
  }

  setChatFunction(chatFunction) {
    this.chatFunction = chatFunction;
  }

  getElement() {
    return this.element;
  }
}

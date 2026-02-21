"use babel";

export class UIHelper {
  constructor(view) {
    this.view = view;
  }

  createRootElement() {
    const element = document.createElement("div");
    element.classList.add("mistral-pane-item");

    return element;
  }

  createMessagesArea(element) {
    const messagesArea = document.createElement("div");
    messagesArea.classList.add("mistral-messages-container");
    element.appendChild(messagesArea);

    return messagesArea;
  }

  setupClearChatButton(element) {
    const clearChatButton = document.createElement("button");
    clearChatButton.classList.add("btn", "mistral-clear-chat-btn");
    clearChatButton.textContent = "Clear Chat";

    clearChatButton.addEventListener("click", () =>
      this.view.clearChatHistory(),
    );

    element.appendChild(clearChatButton);
  }

  createInputContainer(element) {
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("mistral-input-container");
    element.appendChild(inputContainer);

    return inputContainer;
  }

  createInputEditor(inputContainer) {
    const inputEditorElement = document.createElement("atom-text-editor");
    inputEditorElement.setAttribute("placeholder-text", "Message");
    inputEditorElement.classList.add("mistral-input-area");
    inputContainer.appendChild(inputEditorElement);

    return inputEditorElement;
  }

  setupInputEditor(inputEditorElement) {
    setImmediate(() => {
      const editorModel = inputEditorElement.getModel();
      const lineNumberGutter = editorModel.gutterWithName("line-number");
      if (lineNumberGutter) lineNumberGutter.hide();
    });
  }

  createSendButton(inputContainer, onClick) {
    const sendButton = document.createElement("button");
    sendButton.classList.add("btn", "btn-primary", "mistral-send-btn");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", onClick);
    inputContainer.appendChild(sendButton);

    return sendButton;
  }
}

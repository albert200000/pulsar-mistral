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

  createClearChatButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "mistral-clear-chat-btn");
    button.textContent = "Clear Chat";
    button.addEventListener("click", () => this.view.clearChat());

    return button;
  }

  createStopButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "mistral-stop-btn");
    button.textContent = "Stop Response";
    button.addEventListener("click", () =>
      this.view.conversationManager.stop(),
    );

    return button;
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

      editorModel.element.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();

          if (event.shiftKey) {
            editorModel.insertNewline();
          } else {
            this.view.handleSendButtonClick();
          }
        }
      });
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

  createLoadingElement() {
    const element = document.createElement("span");

    element.classList.add(
      "messages-loading",
      "loading",
      "loading-spinner-small",
    );

    return element;
  }

  createConversationSelect() {
    const select = document.createElement("select");
    select.classList.add("input-select");
    const optionEl = document.createElement("option");
    optionEl.textContent = "Select conversation";
    optionEl.value = "";
    select.appendChild(optionEl);

    return select;
  }

  createSelectionOption(conversationId, createdAt) {
    const optionEl = document.createElement("option");
    optionEl.value = conversationId;
    optionEl.textContent = `Conversation - ${createdAt.toISOString().replace("T", " ").slice(0, -5)}`;

    if (conversationId === this.view.conversationId) {
      optionEl.selected = true;
    }

    return optionEl;
  }
}

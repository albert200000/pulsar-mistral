"use babel";

import m from "mithril";

export class InputEditor {
  static inputEditorElement = null;

  static clear() {
    const editor = self.inputEditorElement.getModel();
    editor.setText("");
  }

  async handleSendButtonClick(sendMessageToMistral) {
    if (!self.inputEditorElement) return;
    const editor = self.inputEditorElement.getModel();
    const message = editor.getText().trim();

    if (message) {
      try {
        await sendMessageToMistral(message);
      } catch (err) {
        console.error(err);
      }
    }
  }

  onEditorCreate({ dom, attrs }) {
    self.inputEditorElement = dom;
    const editorModel = dom.getModel();
    const lineNumberGutter = editorModel.gutterWithName("line-number");
    if (lineNumberGutter) lineNumberGutter.hide();

    dom.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();

        if (event.shiftKey) {
          editorModel.insertNewline();
        } else {
          this.handleSendButtonClick(attrs.sendMessageToMistral);
        }
      }
    });
  }

  view({ attrs }) {
    return m("div.mistral-input-container", [
      m("atom-text-editor.mistral-input-area", {
        "placeholder-text": "Message",
        oncreate: this.onEditorCreate,
      }),
      m(
        "button.btn.btn-primary.mistral-send-btn",
        {
          onclick: () => this.handleSendButtonClick(attrs.sendMessageToMistral),
        },
        "Send",
      ),
    ]);
  }
}

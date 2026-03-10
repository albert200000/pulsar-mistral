"use babel";

export class CodeBlockHandler {
  constructor(view) {
    this.view = view;
  }

  createCopyButton(editor) {
    const button = document.createElement("button");
    button.classList.add("copy-code-button", "btn", "icon", "icon-clippy");

    button.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        atom.clipboard.write(editor.getText());
        button.textContent = "Copied!";
        setTimeout(() => (button.textContent = ""), 2000);
      },
      { once: true },
    );

    return button;
  }

  createApplyButton(filepath, selectionElem, editor) {
    const button = document.createElement("button");
    button.textContent = "Apply";
    button.classList.add("apply-code-button", "btn");

    button.addEventListener(
      "click",
      async (event) => {
        event.stopPropagation();
        const text = editor.getText();

        try {
          await atom.workspace.open(filepath);
          const fileEditor = atom.workspace.getActiveTextEditor();

          if (!fileEditor) {
            throw new Error("Could not open file editor");
          }

          if (selectionElem) {
            const selection = selectionElem.textContent.split(" ").map(Number);
            const [startRow, startColumn, endRow, endColumn] = selection;

            fileEditor.setTextInBufferRange(
              [
                [startRow, startColumn],
                [endRow, endColumn],
              ],
              text,
            );
          } else {
            fileEditor.setText(text);
          }

          await fileEditor.save();

          button.textContent = "Applied!";
          setTimeout(() => (button.textContent = "Apply"), 2000);
        } catch (error) {
          console.error("Error applying code:", error);
          button.textContent = "Error!";
          setTimeout(() => (button.textContent = "Apply"), 2000);
        }
      },
      { once: true },
    );

    return button;
  }

  grammarForLanguage(lang) {
    const lower = (lang || "").toLowerCase();

    for (const g of atom.grammars.getGrammars()) {
      if (g.scopeName === lower) return g;
      if (g.name && g.name.toLowerCase() === lower) return g;
      if (g.fileTypes && g.fileTypes.includes(lower)) return g;
      if (g.name && lower === g.name.toLowerCase().replace(/^language-/, ""))
        return g;
    }

    return (
      atom.grammars.grammarForScopeName(`source.${lower}`) ||
      atom.grammars.grammarForScopeName(`text.${lower}.basic`) ||
      null
    );
  }

  insertReadOnlyEditor(htmlElem, codeText, grammar) {
    const editor = atom.workspace.buildTextEditor({});

    editor.setText(codeText);
    editor.setGrammar(grammar);
    editor.setReadOnly(true);
    editor.setCursorBufferPosition(0, 0);
    editor.element.style.fontSize = "12px";
    htmlElem.innerHTML = "";
    htmlElem.appendChild(editor.element);

    return editor;
  }

  handleCodeBlocks(htmlElem, isUser = false) {
    const codeBlocks = htmlElem.querySelectorAll("pre code");

    codeBlocks.forEach((codeBlock) => {
      const codeContainer = document.createElement("div");
      codeContainer.classList.add("code-container");
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
      const metaParent = codeBlock.parentNode.previousElementSibling;
      const filepath = metaParent.querySelector(".hidden-filepath").textContent;
      const selectionElem = metaParent.querySelector(".hidden-selection");

      if (filepath) {
        languageLabel.textContent = filepath;
      }

      if (!isUser) {
        const applyButton = this.createApplyButton(
          filepath,
          selectionElem,
          editor,
        );
        codeCopyContainer.appendChild(applyButton);
      }

      codeCopyContainer.prepend(languageLabel);
      codeCopyContainer.appendChild(copyButton);
      codeContainer.appendChild(codeCopyContainer);
      const preElement = codeBlock.parentNode;
      preElement.parentNode.insertBefore(codeContainer, preElement);
      codeContainer.appendChild(preElement);
    });
  }
}

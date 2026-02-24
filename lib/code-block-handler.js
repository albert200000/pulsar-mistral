"use babel";

export class CodeBlockHandler {
  constructor(view) {
    this.view = view;
  }

  createCopyButton(editor) {
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.classList.add("copy-code-button");

    copyButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        atom.clipboard.write(editor.getText());
        copyButton.textContent = "Copied!";
        setTimeout(() => (copyButton.textContent = "Copy"), 2000);
      },
      { once: true },
    );

    return copyButton;
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

  handleCodeBlocks(htmlElem) {
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
      codeCopyContainer.appendChild(languageLabel);
      codeCopyContainer.appendChild(copyButton);
      codeContainer.appendChild(codeCopyContainer);
      const preElement = codeBlock.parentNode;
      preElement.parentNode.insertBefore(codeContainer, preElement);
      codeContainer.appendChild(preElement);
    });
  }
}

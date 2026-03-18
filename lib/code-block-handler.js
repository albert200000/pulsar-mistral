"use babel";

import m from "mithril";

export class CodeBlockHandler {
  constructor(view) {
    this.view = view;
  }

  createCopyButton(editor) {
    return {
      view: () =>
        m("button.copy-code-button.btn.icon.icon-clippy", {
          onclick: (event) => {
            event.stopPropagation();
            atom.clipboard.write(editor.getText());
            event.target.textContent = "Copied!";
            setTimeout(() => {
              event.target.textContent = "";
              m.redraw();
            }, 2000);
          },
        }),
    };
  }

  createApplyButton(filepath, selectionElem, editor) {
    return {
      view: () =>
        m(
          "button.apply-code-button.btn",
          {
            onclick: async (event) => {
              event.stopPropagation();
              const text = editor.getText();

              try {
                await atom.workspace.open(filepath);
                const fileEditor = atom.workspace.getActiveTextEditor();

                if (!fileEditor) {
                  throw new Error("Could not open file editor");
                }

                if (selectionElem) {
                  const selection = selectionElem.textContent
                    .split(" ")
                    .map(Number);
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

                event.target.textContent = "Applied!";
                setTimeout(() => {
                  event.target.textContent = "Apply";
                  m.redraw();
                }, 2000);
              } catch (error) {
                console.error("Error applying code:", error);
                event.target.textContent = "Error!";
                setTimeout(() => {
                  event.target.textContent = "Apply";
                  m.redraw();
                }, 2000);
              }
            },
          },
          "Apply",
        ),
    };
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

  createCodeEditor(codeText, grammar) {
    return {
      oncreate: ({ dom }) => {
        const editor = atom.workspace.buildTextEditor({});
        editor.setText(codeText);
        editor.setGrammar(grammar);
        editor.setReadOnly(true);
        editor.setCursorBufferPosition(0, 0);
        editor.element.style.fontSize = "12px";
        dom.appendChild(editor.element);
      },
      view: () => m("div.code-editor"),
    };
  }

  handleCodeBlocks(messageElement, isUser = false) {
    // In Mithril, we need to modify the component structure rather than the DOM directly
    // This method should be called from the message component's oncreate/onupdate

    // Get the DOM element from the message component
    const htmlElem = messageElement.dom || messageElement;

    // Find all code blocks
    const codeBlocks = htmlElem.querySelectorAll("pre code");

    codeBlocks.forEach((codeBlock) => {
      const lang = codeBlock.className.slice("language-".length) || "text";
      const grammar = this.grammarForLanguage(lang);
      const text = codeBlock.textContent;

      // Find metadata elements
      const metaParent = codeBlock.parentNode.previousElementSibling;
      const filepath =
        metaParent?.querySelector(".hidden-filepath")?.textContent;
      const selectionElem = metaParent?.querySelector(".hidden-selection");

      // Create code container component
      const codeContainer = {
        view: () =>
          m("div.code-container", [
            m("div.code-copy-container", [
              m("span.code-language-label", filepath || `<> ${lang}`),
              m(this.createCopyButton({ getText: () => text })),
              !isUser && filepath
                ? m(
                    this.createApplyButton(filepath, selectionElem, {
                      getText: () => text,
                    }),
                  )
                : null,
            ]),
            m(
              "pre",
              m("code", {
                class: codeBlock.className,
                oncreate: ({ dom }) => {
                  dom.textContent = text;
                  const editor = atom.workspace.buildTextEditor({});
                  editor.setText(text);
                  editor.setGrammar(grammar);
                  editor.setReadOnly(true);
                  editor.setCursorBufferPosition(0, 0);
                  editor.element.style.fontSize = "12px";
                  dom.innerHTML = "";
                  dom.appendChild(editor.element);
                },
              }),
            ),
          ]),
      };

      // Replace the code block with our component
      const preElement = codeBlock.parentNode;
      const parent = preElement.parentNode;

      // In a real Mithril implementation, we would update the component tree
      // rather than directly manipulating the DOM
      // This is a transitional approach
      parent.insertBefore(
        document
          .createRange()
          .createContextualFragment(m(codeContainer).outerHTML),
        preElement,
      );
      parent.removeChild(preElement);
    });
  }
}

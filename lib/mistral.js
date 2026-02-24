"use babel";

import MistralView from "./mistral-view.js";
import { CompositeDisposable } from "atom";
import { config } from "./config";
// import { modelsList } from "@mistralai/mistralai/funcs/modelsList.js";

export default {
  config,
  mistralView: null,
  subscriptions: null,
  markdownService: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable(
      atom.commands.add("atom-workspace", {
        "mistral:toggle": () => this.toggle(),
        "mistral:add": () => this.add(),
      }),
    );

    this.subscriptions.add(
      atom.workspace.observePanes((pane) => {
        const disp = pane.onDidRemoveItem(({ item }) => {
          if (item === this.mistralView) {
            pane.destroyItem(item);
          }
        });

        this.subscriptions.add(disp);
      }),
    );

    // Check for API key
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      atom.notifications.addError("mistral Error", {
        detail:
          "API key is missing. Please provide your mistral API key with MISTRAL_API_KEY environment variable.",
        dismissable: true,
      });

      return;
    }

    this.initializeMistralView(state);
  },

  initializeMistralView(state) {
    this.mistralView = new MistralView(state.mistralViewState);
    this.mistralView.setChatFunction(
      this.mistralView.handleSendButtonClick.bind(this.mistralView),
    );
  },

  deactivate() {
    this.subscriptions.dispose();

    if (this.mistralView) {
      this.mistralView.destroy();
      this.mistralView = null;
    }
  },

  serialize() {
    return {
      mistralViewState: this.mistralView ? this.mistralView.serialize() : {},
    };
  },

  openDock() {
    const rightDock = atom.workspace.getRightDock();
    const [pane] = rightDock.getPanes();

    pane.addItem(this.mistralView);
    pane.activateItem(this.mistralView);

    rightDock.show();
  },

  toggle() {
    if (!this.mistralView) {
      console.error("Mistral View is not initialized");
      return;
    }

    const mistralPane = atom.workspace.paneForItem(this.mistralView);

    if (mistralPane) {
      mistralPane.destroyItem(this.mistralView);
      return;
    }

    this.openDock();
  },

  async add() {
    if (!this.mistralView) {
      console.error("Mistral View is not initialized");
      return;
    }

    const mistralPane = atom.workspace.paneForItem(this.mistralView);

    if (!mistralPane) {
      this.openDock();
    }

    let text;
    const editor = atom.workspace.getActiveTextEditor();

    if (!editor) {
      return atom.notifications.addInfo("There is no active editor", {
        dismissable: true,
      });
    }

    const grammar = editor.getGrammar();
    const language = grammar.name.toLowerCase();
    let filePath = editor.getPath();
    let startRow, startColumn, endRow, endColumn;

    if (filePath) {
      filePath = atom.project.relativizePath(filePath)[1];
    }

    text = editor.getSelectedText();

    if (text) {
      const selection = editor.getSelectedBufferRange();
      startRow = selection.start.row;
      startColumn = selection.start.column;
      endRow = selection.end.row;
      endColumn = selection.end.column;
    } else {
      text = editor.getText();
    }

    const message = `
${filePath ? `File: ${filePath}` : ""}
${startRow ? `Selection: ${startRow}, ${startColumn}, ${endRow}, ${endColumn}` : ""}
\`\`\`${language}
${text}
\`\`\`
    `;

    try {
      await this.mistralView.conversationManager.sendMessageToMistral(message);
    } catch (err) {
      console.error(err);
    }
  },

  // TODO: this
  // selectModel() {
  //   modelsList(this.mistralView.mistral).then((res) => {
  //     if (res.ok) {
  //       const { value: result } = res;
  //       console.log(result.data);
  //     } else {
  //       console.log("modelsList failed:", res.error);
  //     }
  //   });
  //
  //   atom.config.set("mistral.Model", model);
  // },
};

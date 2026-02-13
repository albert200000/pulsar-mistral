"use babel";

import MistralView from "./mistral-view.js";
import { CompositeDisposable } from "atom";
import { config } from "./config";

export default {
  config,
  mistralView: null,
  modalPanel: null,
  subscriptions: null,
  markdownService: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable(
      atom.commands.add("atom-workspace", {
        "mistral:toggle": () => this.toggle(),
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
    this.addToRightDock(this.mistralView);
  },

  addToRightDock(view) {
    const rightDock = atom.workspace.getRightDock();
    const [pane] = rightDock.getPanes();
    pane.addItem(view);
    pane.activateItem(view);
    rightDock.show();
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

  toggle() {
    if (!this.mistralView) {
      console.error("Mistral View is not initialized");
      return;
    }

    const rightDock = atom.workspace.getRightDock();
    if (
      rightDock.isVisible() &&
      rightDock.getActivePaneItem() === this.mistralView
    ) {
      rightDock.hide();
    } else {
      rightDock.show();
      const [pane] = rightDock.getPanes();
      if (!pane.items.includes(this.mistralView)) {
        pane.addItem(this.mistralView);
      }
      pane.activateItem(this.mistralView);
    }
  },
};

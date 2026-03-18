"use babel";

import { MistralCore } from "@mistralai/mistralai/core.js";
import { betaConversationsList } from "@mistralai/mistralai/funcs/betaConversationsList.js";
import { betaConversationsGetMessages } from "@mistralai/mistralai/funcs/betaConversationsGetMessages.js";
import { betaConversationsDelete } from "@mistralai/mistralai/funcs/betaConversationsDelete.js";
import { betaConversationsStartStream } from "@mistralai/mistralai/funcs/betaConversationsStartStream.js";
import { betaConversationsAppendStream } from "@mistralai/mistralai/funcs/betaConversationsAppendStream.js";
import { modelsList } from "@mistralai/mistralai/funcs/modelsList.js";

const mistral = new MistralCore({
  apiKey: process.env["MISTRAL_API_KEY"] ?? "",
});

export default class MistralApi {
  static async initConversations() {
    const res = await betaConversationsList(mistral);

    if (!res.ok) {
      console.log("betaConversationsList failed:", res.error);
      return;
    }

    const { value: conversations } = res;

    return conversations;
  }

  static async getConversationMessages(conversationId) {
    return await betaConversationsGetMessages(mistral, {
      conversationId,
    });
  }

  static async deleteConversation(conversationId) {
    return await betaConversationsDelete(mistral, {
      conversationId,
    });
  }

  static async modelsList() {
    return await modelsList(mistral);
  }

  static async startStream(customInstructions, commonFields, commonOptions) {
    return await betaConversationsStartStream(
      mistral,
      {
        instructions: customInstructions,
        ...commonFields,
      },
      commonOptions,
    );
  }

  static async appendStream(conversationId, commonFields, commonOptions) {
    return await betaConversationsAppendStream(
      mistral,
      {
        conversationId,
        conversationAppendStreamRequest: commonFields,
      },
      commonOptions,
    );
  }
}

module.exports.config = {
  Model: {
    title: "Mistral Model",
    description: "The model to be used for responses.",
    type: "string",
    default: "mistral-large-2512",
    enum: [
      {
        value: "mistral-large-2512",
        description: "mistral-large-2512",
      },
      {
        value: "mistral-small-2506",
        description: "mistral-small-2506",
      },
      {
        value: "devstral-2512",
        description: "devstral-2512",
      },
      {
        value: "devstral-small-2507",
        description: "devstral-small-2507",
      },
    ],
    order: 1,
  },
  CustomModel: {
    title: "Enter Custom Model",
    type: "string",
    default: "",
    order: 2,
  },
  CustomInstructions: {
    title: "Mistral Custom Instructions",
    description: "Custom instructions that tell Mistral how to behave.",
    type: "string",
    default: "You are a Pulsar text editor assistant",
    order: 3,
  },
};

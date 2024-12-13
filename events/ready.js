const fs = require("fs");
require("dotenv").config();
const { Events, EmbedBuilder } = require("discord.js");
module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log("[✅] The bot has successfully started.");
  },
};

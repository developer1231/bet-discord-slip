const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slip")
    .setDescription("Create a new embed dynamically")
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Set the description of the embed")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("units")
        .setDescription("Set the units text for the embed")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("sportsbook")
        .setDescription("Choose a SportsBook")
        .addChoices(
          { name: "FanDuel", value: "FanDuel" },
          { name: "BetMGM", value: "BetMGM" },
          { name: "DraftKings", value: "DraftKings" },
          { name: "PrizePicks", value: "PrizePicks" },
          { name: "ESPN", value: "ESPN" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("Add a betlink for the embed")

        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("Provide an image")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Mention a role to tag in the embed")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(":x: | Error Executing")
        .setThumbnail(interaction.guild.iconURL())
        .setDescription(
          `> Dear ${interaction.member}, you don't have the required permissions to execute this command. Please try again later.`
        )
        .setTimestamp()
        .setAuthor({
          name: `${interaction.client.user.username}`,
          iconURL: `${interaction.client.user.displayAvatarURL()}`,
        })
        .setColor("#9D00FF")
        .setFooter({ text: `⭐️ | BetSharer` });

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    function emoji(name) {
      if (name === "FanDuel") {
        return "<:fan:1316915820923846739>";
      } else if (name === "BetMGM") {
        return "<:betmgm:1316915779954016328>";
      } else if (name === "DraftKings") {
        return "<:draft:1316915794948390912>";
      } else if (name === "PrizePicks") {
        return "<:prizepicks:1316915840792395816>";
      } else {
        return "<:espn:1316915808592597122>";
      }
    }

    const description = interaction.options.getString("description");
    const units = interaction.options.getString("units");
    const betlink = interaction.options.getString("link");
    const link_type = interaction.options.getString("sportsbook");
    const image = interaction.options.getAttachment("image");
    const role = interaction.options.getRole("role");

    const embed = new EmbedBuilder()
      .setThumbnail(interaction.guild.iconURL())
      .setDescription(`> ${description}\n\n> **Units:**\n> ${units}`)
      .setTimestamp()
      .setAuthor({
        name: `${interaction.client.user.username}`,
        iconURL: `${interaction.client.user.displayAvatarURL()}`,
      })
      .setColor("#9D00FF")
      .setFooter({
        text: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      });

    if (image) embed.setImage(image.url);

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(betlink)
        .setEmoji(`${emoji(link_type)}`)
        .setLabel(`Place This Bet on ${link_type}`)
        .setStyle(ButtonStyle.Link)
    );

    await interaction.channel.send({
      content: role ? `${role}` : "",
      embeds: [embed],
      components: [actionRow],
    });
    await interaction.reply({
      ephemeral: true,
      content: `> :white_check_mark: Successfully sent the embed to ${interaction.channel}.`,
    });
  },
};

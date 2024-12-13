const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
require("dotenv").config();
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hideslip")
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
    let components = JSON.parse(fs.readFileSync("./components.json", "utf8"));
    function makeid(length) {
      let result = "";
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const charactersLength = characters.length;
      let counter = 0;
      while (counter < length) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
        counter += 1;
      }
      return result;
    }

    console.log(makeid(5));
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

    const id = makeid(10);
    const description = interaction.options.getString("description");
    const units = interaction.options.getString("units");
    const betlink = interaction.options.getString("link");
    const link_type = interaction.options.getString("sportsbook");
    const image = interaction.options.getAttachment("image");
    const role = interaction.options.getRole("role");
    const toViewComponent = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${id}`)
        .setLabel("Generate View")
        .setEmoji("💲")
        .setStyle(ButtonStyle.Primary)
    );
    const toView = new EmbedBuilder()
      .setThumbnail(interaction.guild.iconURL())
      .setDescription(
        `> Dear member, a new **bet share** has been published!\n> Please click on the **Generate View** button below to view the bet data.`
      )
      .setTimestamp()
      .setImage(
        "https://w0.peakpx.com/wallpaper/334/488/HD-wallpaper-chart-cryptocurrency-black-violet-blue-candlestick-bitcoin.jpg"
      )
      .setAuthor({
        name: `${interaction.client.user.username}`,
        iconURL: `${interaction.client.user.displayAvatarURL()}`,
      })
      .setColor("#9D00FF")
      .setFooter({
        text: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      });
    await interaction.reply({
      content: role ? `${role}` : "",
      embeds: [toView],
      components: [toViewComponent],
    });

    components[id] = {
      description: description,
      units: units,
      betlink: betlink,
      link_type: link_type,
      image: image ? image.url : null,
      role: role ? role.id : null,
    };
    fs.writeFileSync("./components.json", JSON.stringify(components), (err) => {
      if (err) console.log(err);
    });
  },
};

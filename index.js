require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const {
  REST,
  Routes,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require("discord.js");
const {
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a) => {
    return GatewayIntentBits[a];
  }),
});

const commands = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);
client.commands = new Collection();
for (const folder of commandFolders) {
  if (fs.lstatSync("./commands/" + folder).isDirectory()) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      {
        body: commands,
      }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
console.log(process.env.CLIENT_ID);
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

async function addWatermarks(imageUrl, stamp) {
  try {
    const image = await loadImage(imageUrl);
    console.log("Image loaded successfully:", image.width, image.height);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0, image.width, image.height);

    const watermarkText = stamp;
    ctx.font = `${Math.floor(image.width / 20)}px Arial`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const step = image.height / 4;
    for (let i = 0; i < 4; i++) {
      const y = step * i + step / 2;
      const x = (image.width / 4) * i + step / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    }

    const buffer = canvas.toBuffer("image/png");

    console.log("Buffer generated, size:", buffer.length);

    fs.writeFileSync("./images/watermarked_image.png", buffer);
    console.log("Watermarked image saved to ./images/watermarked_image.png");
  } catch (error) {
    console.error("Error processing image:", error);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  let command = client.commands.get(interaction.commandName);
  if (interaction.isCommand()) {
    command.execute(interaction);
  }
  if (interaction.isButton()) {
    let components = JSON.parse(fs.readFileSync("./components.json", "utf8"));
    let filtered = Object.keys(components).filter(
      (key) => key === interaction.customId
    );
    console.log(filtered);
    if (filtered.length > 0) {
      let data = components[filtered[0]];

      const description = data.description;
      const units = data.units;
      const betlink = data.betlink;
      const link_type = data.link_type;
      const image = data.image;

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

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(betlink)
          .setEmoji(`${emoji(link_type)}`)
          .setLabel(`Place This Bet on ${link_type}`)
          .setStyle(ButtonStyle.Link)
      );
      if (image) {
        addWatermarks(image, `${interaction.member.id}`).then(
          async (buffer) => {
            const attachment = new AttachmentBuilder(
              "./images/watermarked_image.png",
              {
                name: "watermark.png",
              }
            );
            if (image) embed.setImage("attachment://watermark.png");
            await interaction.reply({
              ephemeral: true,
              embeds: [embed],
              components: [actionRow],
              files: [attachment],
            });
          }
        );
      } else {
        await interaction.reply({
          ephemeral: true,
          embeds: [embed],
          components: [actionRow],
        });
      }
    } else {
      await interaction.reply({
        ephemeral: true,
        content: `> :x: An error occurred. This button could not be recognized by the system.`,
      });
    }
  }
});
client.login(process.env.DISCORD_BOT_TOKEN);

import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import dotenv from 'dotenv';
import express from 'express'; // For Render compatibility

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OPEN_CATEGORY_ID = process.env.OPEN_CATEGORY_ID;
const CLOSED_CATEGORY_ID = process.env.CLOSED_CATEGORY_ID;

// --- Debug ---
console.log("BOT_TOKEN:", TOKEN ? "SET" : "NOT SET");
console.log("CLIENT_ID:", CLIENT_ID ? "SET" : "NOT SET");
console.log("OPEN_CATEGORY_ID:", OPEN_CATEGORY_ID ? "SET" : "NOT SET");
console.log("CLOSED_CATEGORY_ID:", CLOSED_CATEGORY_ID ? "SET" : "NOT SET");

if (!TOKEN || !CLIENT_ID || !OPEN_CATEGORY_ID || !CLOSED_CATEGORY_ID) {
  console.error("One or more environment variables are missing!");
  process.exit(1);
}

// --- CLIENT SETUP ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// --- READY EVENT ---
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --- SLASH COMMAND REGISTRATION ---
const commands = [
  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Send the ticket creation panel message'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();

// --- HANDLE SLASH COMMAND ---
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticketpanel') {
    const embed = new EmbedBuilder()
      .setTitle('Support Ticket System')
      .setDescription('Click the button below to create a new support ticket.')
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
});

// --- HANDLE BUTTON INTERACTIONS ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;

  if (interaction.customId === 'create_ticket') {
    const existing = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
    if (existing) {
      return interaction.reply({
        content: 'You already have an open ticket.',
        flags: 64
      });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: OPEN_CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]},
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle('Ticket Created')
      .setDescription('Support will be with you soon.\nClick the button below to close this ticket.')
      .setColor(0x00FF00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
    await interaction.reply({
      content: `Your ticket has been created: ${ticketChannel}`,
      flags: 64
    });
  }

  if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    await channel.setParent(CLOSED_CATEGORY_ID);
    await channel.permissionOverwrites.set([
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    ]);
    await channel.send('Ticket closed. Thank you for contacting support!');
  }
});

// --- EXPRESS SERVER FOR RENDER ---
const app = express();
app.get('/', (req, res) => res.send('Discord bot is running.'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// --- LOGIN BOT ---
client.login(TOKEN);

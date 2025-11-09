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

// Load environment variables from .env
dotenv.config();

// Load variables
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OPEN_CATEGORY_ID = process.env.OPEN_CATEGORY_ID;
const CLOSED_CATEGORY_ID = process.env.CLOSED_CATEGORY_ID;

// Debug: Check environment variables
console.log("BOT_TOKEN:", TOKEN ? "SET" : "NOT SET");
console.log("CLIENT_ID:", CLIENT_ID ? "SET" : "NOT SET");
console.log("OPEN_CATEGORY_ID:", OPEN_CATEGORY_ID ? "SET" : "NOT SET");
console.log("CLOSED_CATEGORY_ID:", CLOSED_CATEGORY_ID ? "SET" : "NOT SET");

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
  console.log(`✅ Logged in as ${client.user.tag}`);
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
    console.log('📦 Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();

// --- HANDLE SLASH COMMAND: /ticketpanel ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ticketpanel') {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Ticket System')
      .setDescription('Click the button b

import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits, Events } from "discord.js";

import { handleItemAdd } from "./commands/item/add.js";
import { handleItemSearch } from "./commands/item/search.js";
import { handleItemDelete } from "./commands/item/delete.js";
import { handleItemList } from "./commands/item/list.js";
import { handleItemsBulkAdd } from "./commands/item/bulkAdd.js";

import { handleInventoryAdd } from "./commands/inventory/add.js";
import { handleInventoryList } from "./commands/inventory/list.js";
import { handleInventoryDelete } from "./commands/inventory/delete.js";

const { DISCORD_TOKEN, API_ENDPOINT, LOOTLIST_SECRET, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !API_ENDPOINT || !LOOTLIST_SECRET || !CLIENT_ID) {
  console.error("Missing required environment variables. Check your .env file.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "item") {
    const sub = interaction.options.getSubcommand();
    if (sub === "add") return handleItemAdd(interaction);
    if (sub === "bulkadd") return handleItemsBulkAdd(interaction);
    if (sub === "search") return handleItemSearch(interaction);
    if (sub === "delete") return handleItemDelete(interaction);
    if (sub === "list") return handleItemList(interaction);
  }

  if (commandName === "inv") {
    const sub = interaction.options.getSubcommand();
    if (sub === "add") return handleInventoryAdd(interaction);
    if (sub === "delete") return handleInventoryDelete(interaction);
    if (sub === "list") return handleInventoryList(interaction);
  }
});

client.login(DISCORD_TOKEN);

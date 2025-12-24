import dotenv from "dotenv";
import { handleItemAdd } from "./commands/item/add.js";
import { handleItemSearch } from "./commands/item/search.js";
import { handleItemDelete } from "./commands/item/delete.js";

import { handleInventoryAdd } from "./commands/inventory/add.js";
import { handleInventoryList } from "./commands/inventory/list.js";
import { handleInventoryDelete } from "./commands/inventory/delete.js";
dotenv.config();

import { Client, GatewayIntentBits, Events } from "discord.js";
import { handleItemList } from "./commands/item/list.js";
import { handleItemsBulkAdd } from "./commands/item/bulkAdd.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    const res = await fetch(`${process.env.API_ENDPOINT}/items/list`, {
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
      },
    });

    const data = await res.json();

    if (!data.length) {
      return interaction.reply(`No data`);
    } else {
      return interaction.reply(data);
    }
  }

  if (interaction.commandName === "item") {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      return handleItemAdd(interaction);
    } else if (sub === "bulkadd") {
      return handleItemsBulkAdd(interaction);
    } else if (sub === "search") {
      return handleItemSearch(interaction);
    } else if (sub === "delete") {
      return handleItemDelete(interaction);
    } else if (sub === "list") {
      return handleItemList(interaction);
    }
  } else if (interaction.commandName === "inv") {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      return handleInventoryAdd(interaction);
    } else if (sub === "delete") {
      return handleInventoryDelete(interaction);
    } else if (sub === "list") {
      return handleInventoryList(interaction);
    }
  }
});

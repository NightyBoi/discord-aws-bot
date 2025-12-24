import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("inv")
    .setDescription("Manage personal inventory")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add an existing item to your inventory")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Exact item name (must exist in this server)")
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("qty").setDescription("Quantity to add").setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Remove an item from your inventory")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Exact item name (must exist in this server)")
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("qty").setDescription("Quantity to remove").setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View user's inventory (defaults to yours)")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("User to view (optional)")
            .setRequired(false)
        )
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("item")
    .setDescription("Manage lootlist items")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add or update an item")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Item name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("Item description (use \\n for new line)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Item type (Weapon, Armor, Wondrous Item, etc)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("rarity").setDescription("Common, Uncommon, Rare, etc")
        )
        .addStringOption((opt) =>
          opt
            .setName("attunement")
            .setDescription("Requires attunement? Yes/No")
        )
        .addIntegerOption((opt) =>
          opt.setName("price").setDescription("Market Price")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("bulkadd")
        .setDescription("Bulk add items from a CSV file")
        .addAttachmentOption((opt) =>
          opt
            .setName("file")
            .setDescription("CSV file containing item data")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("search")
        .setDescription("Search for an item")
        .addStringOption((opt) =>
          opt.setName("query").setDescription("Search text").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete an item")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Exact item name")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List all items in the server")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Name begins with...")
        )
        .addStringOption((opt) =>
          opt
            .setName("rarity")
            .setDescription("Filter by rarity")
            .addChoices(
              { name: "Common", value: "Common" },
              { name: "Uncommon", value: "Uncommon" },
              { name: "Rare", value: "Rare" },
              { name: "Very Rare", value: "Very Rare" },
              { name: "Legendary", value: "Legendary" },
              { name: "Artifact", value: "Artifact" }
            )
        )
        .addStringOption((opt) =>
          opt.setName("type").setDescription("Filter by item type")
        )
        .addStringOption((opt) =>
          opt
            .setName("attunement")
            .setDescription("Requires Attunement?")
            .addChoices(
              { name: "Yes", value: "Yes" },
              { name: "No", value: "No" }
            )
        )
    ),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Refreshing clash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands,
      }
    );

    console.log("Slash commands registered!");
  } catch (err) {
    console.error(err);
  }
})();

import dotenv from "dotenv";
dotenv.config();

import { handleItemSearch } from "../item/search.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

const PAGE_SIZE = 20;

function itemIdToDisplay(itemId) {
  return itemId
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function handleInventoryList(interaction) {
  await interaction.deferReply();

  const serverId = interaction.guildId;

  const targetUser = interaction.options.getUser("user"); // optional
  const userId = targetUser?.id || interaction.user.id;
  const userName = targetUser?.username || interaction.user.username;

  const queryParams = new URLSearchParams({
    serverId,
    userId,
  });

  const res = await fetch(
    `${process.env.API_ENDPOINT}/inv/list?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
      },
    }
  );

  const data = await res.json();
  const rawItems = data.results || [];

  if (!rawItems.length) {
    return interaction.editReply("Your inventory is empty!");
  }

  const items = rawItems.map(({ itemId, qty }) => ({
    name: itemIdToDisplay(itemId),
    qty,
  }));

  let page = 1;

  const getPageEmbed = (page) => {
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    const listText = pageItems
      .map(
        (item, idx) => `${start + idx + 1}. **${item.name}** - _${item.qty}x_`
      )
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle(`${userName}'s Inventory`)
      .setDescription(listText)
      .setColor(0x5865f2)
      .setFooter({ text: `Page ${page} / ${totalPages}` });

    const row = new ActionRowBuilder();

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("inv_first")
        .setEmoji("⏪")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page == 1 ? true : false)
    );
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("inv_prev")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page == 1 ? true : false)
    );

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("inv_next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(start + PAGE_SIZE < items.length ? false : true)
    );

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("inv_last")
        .setEmoji("⏩")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(start + PAGE_SIZE < items.length ? false : true)
    );

    const select = new StringSelectMenuBuilder()
      .setCustomId("inv_item_select")
      .setPlaceholder("Select an item to inspect")
      .addOptions(
        pageItems.map((item) => ({
          label: item.name.substring(0, 25),
          value: item.name,
        }))
      );

    return {
      embed,
      components: [row, new ActionRowBuilder().addComponents(select)],
    };
  };

  const pageData = getPageEmbed(page);

  const filteredComponents = pageData.components.filter(
    (row) => row.components.length > 0
  );

  const msg = await interaction.editReply({
    embeds: [pageData.embed],
    components: filteredComponents,
  });

  const collector = msg.createMessageComponentCollector({
    time: 120_000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: "Not your list!", ephemeral: true });
    }

    if (i.customId === "inv_next") page++;
    if (i.customId === "inv_prev") page--;
    if (i.customId === "inv_first") page = 1;
    if (i.customId === "inv_last") page = Math.ceil(items.length / PAGE_SIZE);

    if (i.customId === "inv_item_select") {
      const name = i.values[0];
      await i.deferUpdate();
      //return interaction.followUp(`Inspecting: ${name}`);

      interaction.fromSelectMenu = true;
      interaction.options.getString = () => name;

      return handleItemSearch(interaction);
      // Update this
    }

    const newData = getPageEmbed(page);
    await i.update({
      embeds: [newData.embed],
      components: newData.components,
    });
  });

  collector.on("end", () => {
    msg.edit({
      components: [],
    });
  });
}

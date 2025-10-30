import dotenv from "dotenv";
dotenv.config();

import { handleItemSearch } from "./search.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from "discord.js";

const PAGE_SIZE = 20;

export async function handleItemList(interaction) {
  await interaction.deferReply();

  const serverId = interaction.guildId;

  const nameFilter = interaction.options.getString("name") || null;
  const rarityFilter = interaction.options.getString("rarity") || null;
  const typeFilter = interaction.options.getString("type") || null;
  const attunementFilter = interaction.options.getString("attunement") || null;

  const queryParams = new URLSearchParams({
    serverId,
    ...(nameFilter ? { name: nameFilter } : {}),
    ...(rarityFilter ? { rarity: rarityFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(attunementFilter ? { attunement: attunementFilter } : {}),
  });

  const res = await fetch(
    `${process.env.API_ENDPOINT}/items/list?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
      },
    }
  );

  const data = await res.json();
  const items = data.results || [];

  if (!items.length) {
    return interaction.editReply("No items in this server yet!");
  }

  let page = 1;

  const getPageEmbed = (page) => {
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    const listText = pageItems
      .map(
        (item, idx) => `${start + idx + 1}. **${item.name}** - _${item.type}_`
      )
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("Lootlist Items")
      .setDescription(listText)
      .setColor(0x5865f2)
      .setFooter({ text: `Page ${page} / ${totalPages}` });

    const row = new ActionRowBuilder();

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("first")
        .setEmoji("⏪")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page == 1 ? true : false)
    );
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page == 1 ? true : false)
    );

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(start + PAGE_SIZE < items.length ? false : true)
    );

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("last")
        .setEmoji("⏩")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(start + PAGE_SIZE < items.length ? false : true)
    );

    const select = new StringSelectMenuBuilder()
      .setCustomId("item_select")
      .setPlaceholder("Select an item to inspect")
      .addOptions(
        pageItems.map((item) => ({
          label: item.name.substring(0, 25),
          description: item.type,
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

    if (i.customId === "next") page++;
    if (i.customId === "prev") page--;
    if (i.customId === "first") page = 1;
    if (i.customId === "last") page = Math.ceil(items.length / PAGE_SIZE);

    if (i.customId === "item_select") {
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

  //   const selectRow = new ActionRowBuilder().addComponents(select);
  //   //const components = row.components.length > 0 ? [row] : [];
  //   const components = [];

  //   if (row.components.length > 0) components.push(row);
  //   components.push(selectRow);

  //   await interaction.editReply({
  //     embeds: [embed],
  //     components: components,
  //   });
}

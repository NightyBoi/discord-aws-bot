const rarityColors = {
  Common: 0xaaaaaa,
  Uncommon: 0x52ad26,
  Rare: 0x3f9ef9,
  "Very Rare": 0x8745b1,
  Legendary: 0xe68624,
  Artifact: 0xf23838,
};

export async function fetchItem(query, serverId) {
  const res = await fetch(
    `${process.env.API_ENDPOINT}/items/search?q=${encodeURIComponent(query)}&serverId=${serverId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Search request failed: ${res.status}`);

  const data = await res.json();
  return data.results?.[0] ?? null;
}

export function buildItemEmbed(item) {
  const color = rarityColors[item.rarity] ?? 0xffffff;

  return {
    title: item.name,
    description: item.description || "/",
    color,
    fields: [
      { name: "Type", value: item.type || "/", inline: false },
      { name: "Rarity", value: item.rarity || "/", inline: true },
      { name: "Attunement", value: item.requiresAttunement || "No", inline: true },
      { name: "Market Price", value: `${item.marketPrice} SP`, inline: true },
    ],
  };
}

export async function handleItemSearch(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString("query");
  const serverId = interaction.guildId;

  try {
    const item = await fetchItem(query, serverId);

    if (!item) {
      return interaction.editReply(`No items found for: **${query}**`);
    }

    return interaction.editReply({ embeds: [buildItemEmbed(item)] });
  } catch (err) {
    console.error(err);
    return interaction.editReply("Failed to search items. Try again later.");
  }
}

import dotenv from "dotenv";
dotenv.config();

export async function handleItemSearch(interaction, overrideQuery = null) {
  if (!interaction.fromSelectMenu) {
    await interaction.deferReply();
  }

  const query = overrideQuery ?? interaction.options.getString("query");
  const serverId = interaction.guildId;

  const res = await fetch(
    `${process.env.API_ENDPOINT}/items/search?q=${encodeURIComponent(
      query
    )}&serverId=${serverId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
      },
    }
  );

  const data = await res.json();

  console.log("Server ID:", serverId);

  if (!data.results?.length) {
    return interaction.editReply(`No items found for: **${query}**`);
  }

  const item = data.results[0];

  const rarityColors = {
    Common: 0xaaaaaa,
    Uncommon: 0x52ad26,
    Rare: 0x3f9ef9,
    "Very Rare": 0x8745b1,
    Legendary: 0xe68624,
    Artifact: 0xf23838,
  };

  const color = rarityColors[item.rarity] || 0xffffff;

  return interaction.editReply({
    embeds: [
      {
        title: item.name,
        description: item.description || "/",
        color,
        fields: [
          { name: "Type", value: item.type || "/", inline: false },
          { name: "Rarity", value: `${item.rarity}` || "/", inline: true },
          {
            name: "Attunement",
            value: item.requiresAttunement || "No",
            inline: true,
          },
          {
            name: "Market Price",
            value: `${item.marketPrice} SP`,
            inline: true,
          },
        ],
      },
    ],
  });
}

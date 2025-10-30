import dotenv from "dotenv";
dotenv.config();

export async function handleItemAdd(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({
      content: "This command only works in servers!",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const name = interaction.options.getString("name");
  const descriptionRaw = interaction.options.getString("description");
  const description = descriptionRaw.replace(/\\n/g, "\n");
  const type = interaction.options.getString("type");
  const rarity = interaction.options.getString("rarity");
  const requiresAttunement =
    interaction.options.getString("attunement")?.toLowerCase() === "yes"
      ? "Yes"
      : "No";
  const marketPrice = interaction.options.getInteger("price") || 0;

  const serverId = interaction.guildId;

  try {
    const res = await fetch(`${process.env.API_ENDPOINT}/items/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverId,
        name,
        description,
        type,
        rarity,
        requiresAttunement,
        marketPrice,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return interaction.editReply(
        `Error: ${data.error || "Something went wrong"}`
      );
    }

    return interaction.editReply(`**${name}** added to Lootlist!`);
  } catch (err) {
    console.error(err);
    return interaction.editReply("Failed to reach database. Try again later.");
  }
}

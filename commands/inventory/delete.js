export async function handleInventoryDelete(interaction) {
  await interaction.deferReply();

  const name = interaction.options.getString("name");
  const serverId = interaction.guildId;
  const userId = interaction.user.id;

  try {
    const res = await fetch(
      `${process.env.API_ENDPOINT}/inv/delete?name=${encodeURIComponent(name)}&serverId=${serverId}&userId=${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return interaction.editReply(`${data.error || "Failed to delete item"}`);
    }

    return interaction.editReply(`Deleted **${name}** from your inventory.`);
  } catch (err) {
    console.error(err);
    return interaction.editReply("Failed to reach database. Try again later.");
  }
}

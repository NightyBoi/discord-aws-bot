export async function handleItemDelete(interaction) {
  await interaction.deferReply();

  const name = interaction.options.getString("name");
  const serverId = interaction.guildId;

  try {
    const res = await fetch(
      `${process.env.API_ENDPOINT}/items/delete?name=${encodeURIComponent(name)}&serverId=${serverId}`,
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

    return interaction.editReply(`Deleted **${name}** successfully!`);
  } catch (err) {
    console.error(err);
    return interaction.editReply("Failed to reach database. Try again later.");
  }
}

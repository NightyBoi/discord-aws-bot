import dotenv from "dotenv";
dotenv.config();

export async function handleInventoryAdd(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({
      content: "This command only works in servers!",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const serverId = interaction.guildId;
  const userId = interaction.user.id;

  const name = interaction.options.getString("name");
  const qty = interaction.options.getInteger("qty") || 1;

  try {
    const res = await fetch(`${process.env.API_ENDPOINT}/inv/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverId,
        userId,
        name,
        qty,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return interaction.editReply(
        `Error: ${data.error || "Something went wrong"}`
      );
    }

    return interaction.editReply(
      `Added **${data.qtyAdded || qty}** x **${
        data.itemName || name
      }** to your inventory!`
    );
  } catch (err) {
    console.error(err);
    return interaction.editReply("Failed to reach database. Try again later.");
  }
}

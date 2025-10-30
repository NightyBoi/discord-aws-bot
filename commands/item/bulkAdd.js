import dotenv from "dotenv";
import csv from "csv-parser";
import { Readable } from "stream";

dotenv.config();

export async function handleItemsBulkAdd(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({
      content: "This command only works in servers!",
      ephemeral: true,
    });
  }

  const attachment = interaction.options.getAttachment("file");

  if (!attachment || !attachment.name.endsWith(".csv")) {
    return interaction.reply({
      content: "Please upload a valid `.csv` file.",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    const res = await fetch(attachment.url);
    const text = await res.text();

    const items = [];
    await new Promise((resolve, reject) => {
      Readable.from(text)
        .pipe(csv())
        .on("data", (row) => {
          items.push({
            name: row.name?.trim(),
            description: row.description?.replace(/\\n/g, "\n"),
            type: row.type,
            rarity: row.rarity || "",
            requiresAttunement:
              row.attunement?.toLowerCase() === "yes" ? "Yes" : "No",
            marketPrice: parseInt(row.price?.replace(/[^0-9.-]/g, "") || "0"),
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (items.length === 0) {
      return interaction.editReply("No valid rows found in CSV.");
    }

    const res2 = await fetch(`${process.env.API_ENDPOINT}/items/bulkadd`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOOTLIST_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverId: interaction.guildId,
        items,
      }),
    });

    const data = await res2.json();

    if (!res2.ok) {
      return interaction.editReply(
        `Error: ${data.error || "Failed to process items"}`
      );
    }

    return interaction.editReply(
      `Successfully added **${data.addedCount}** items to Lootlist!`
    );
  } catch (err) {
    console.error(err);
    return interaction.editReply("Failed to process file. Try again later.");
  }
}

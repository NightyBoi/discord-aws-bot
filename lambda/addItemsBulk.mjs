import { DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });

export async function addItemsBulk(event) {
  try {
    const body = JSON.parse(event.body);
    const { serverId, items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No items provided" }),
      };
    }

    const requests = items.map((item) => {
      const cleanName = item.name.trim();
      const itemId = cleanName.toUpperCase().replace(/\s+/g, "_");
      const sortName = cleanName.toUpperCase();

      return {
        PutRequest: {
          Item: {
            PK: { S: `ITEM#${itemId}` },
            SK: { S: `SERVER#${serverId}` },
            name: { S: cleanName },
            sortName: { S: sortName },
            description: { S: item.description },
            type: { S: item.type },
            rarity: { S: item.rarity },
            requiresAttunement: { S: item.requiresAttunement },
            marketPrice: { N: String(item.marketPrice) },
          },
        },
      };
    });

    const chunks = [];
    for (let i = 0; i < requests.length; i += 25) {
      chunks.push(requests.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await db.send(
        new BatchWriteItemCommand({ RequestItems: { Lootlistdb: chunk } })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "OK", addedCount: items.length }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to bulk add items" }),
    };
  }
}

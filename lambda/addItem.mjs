import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });

export async function addItem(event) {
  try {
    const body = JSON.parse(event.body);

    const {
      serverId,
      name,
      description,
      type,
      rarity,
      requiresAttunement,
      marketPrice = 0,
    } = body;

    const cleanName = name.trim();
    const itemId = cleanName.toUpperCase().replace(/\s+/g, "_");
    const sortName = cleanName.toUpperCase();

    await db.send(
      new PutItemCommand({
        TableName: "Lootlistdb",
        Item: {
          PK: { S: `ITEM#${itemId}` },
          SK: { S: `SERVER#${serverId}` },
          name: { S: cleanName },
          sortName: { S: sortName },
          description: { S: description },
          type: { S: type },
          rarity: { S: rarity },
          requiresAttunement: { S: requiresAttunement },
          marketPrice: { N: String(marketPrice) },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "OK", itemId }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to add item" }),
    };
  }
}

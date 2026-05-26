import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });

export async function inventoryDelete(event) {
  try {
    const params = event.queryStringParameters || {};
    const name = params.name?.trim();
    const serverId = params.serverId;
    const userId = params.userId;

    if (!name || !serverId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name, serverId, or userId" }),
      };
    }

    const itemId = name.toUpperCase().replace(/\s+/g, "_");

    await db.send(
      new DeleteItemCommand({
        TableName: "Lootlistdb",
        Key: {
          PK: { S: `USER#${userId}` },
          SK: { S: `SERVER#${serverId}#ITEM#${itemId}` },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item removed from inventory" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete inventory item" }),
    };
  }
}

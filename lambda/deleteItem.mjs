import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });

export async function deleteItem(event) {
  try {
    const params = event.queryStringParameters || {};
    const name = params.name?.trim();
    const serverId = params.serverId;

    if (!name || !serverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name or serverId" }),
      };
    }

    const itemId = name.toUpperCase().replace(/\s+/g, "_");

    await db.send(
      new DeleteItemCommand({
        TableName: "Lootlistdb",
        Key: {
          PK: { S: `ITEM#${itemId}` },
          SK: { S: `SERVER#${serverId}` },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item deleted" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete item" }),
    };
  }
}

import { DynamoDBClient, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });
const TABLE = "Lootlistdb";

export async function inventoryAdd(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const { serverId, userId, name, qty } = body;

    if (!serverId || !userId || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing serverId, userId, or name" }),
      };
    }

    const cleanName = name.trim();
    const sortName = cleanName.toUpperCase();
    const serverKey = `SERVER#${serverId}`;

    const addQty = parseInt(qty ?? 1, 10);
    const inc = Number.isFinite(addQty) && addQty > 0 ? addQty : 1;

    const found = await db.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "SK-sortName-index",
        KeyConditionExpression: "SK = :sk AND begins_with(#sortName, :sn)",
        ExpressionAttributeValues: {
          ":sk": { S: serverKey },
          ":sn": { S: sortName },
        },
        ExpressionAttributeNames: { "#sortName": "sortName" },
        Limit: 1,
      })
    );

    const item = found.Items?.[0];

    if (!item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Item not found on this server" }),
      };
    }

    const pk = item.PK?.S || "";
    const itemId = pk.startsWith("ITEM#") ? pk.slice("ITEM#".length) : null;

    if (!itemId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid item record" }),
      };
    }

    await db.send(
      new UpdateItemCommand({
        TableName: TABLE,
        Key: {
          PK: { S: `USER#${userId}` },
          SK: { S: `SERVER#${serverId}#ITEM#${itemId}` },
        },
        UpdateExpression: "ADD qty :inc",
        ExpressionAttributeValues: {
          ":inc": { N: String(inc) },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "OK",
        itemId,
        itemName: item.name?.S || cleanName,
        qtyAdded: inc,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to add item to inventory" }),
    };
  }
}

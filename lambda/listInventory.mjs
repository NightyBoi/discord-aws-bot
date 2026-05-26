import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });
const TABLE = "Lootlistdb";

export async function inventoryList(event) {
  try {
    const params = event.queryStringParameters || {};
    const serverId = params.serverId;
    const userId = params.userId;

    if (!serverId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing serverId or userId" }),
      };
    }

    const invPK = `USER#${userId}`;
    const prefix = `SERVER#${serverId}#ITEM#`;

    const invRes = await db.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :pref)",
        ExpressionAttributeValues: {
          ":pk": { S: invPK },
          ":pref": { S: prefix },
        },
        ProjectionExpression: "SK, qty",
      })
    );

    const invItems = invRes.Items ?? [];

    if (!invItems.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({ results: [] }),
      };
    }

    const results = invItems
      .map((item) => {
        const sk = item.SK?.S || "";
        const itemId = sk.startsWith(prefix) ? sk.slice(prefix.length) : null;
        return {
          itemId,
          qty: item.qty?.N ? parseInt(item.qty.N, 10) : 0,
        };
      })
      .filter((x) => x.itemId);

    return {
      statusCode: 200,
      body: JSON.stringify({ results }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to list inventory" }),
    };
  }
}

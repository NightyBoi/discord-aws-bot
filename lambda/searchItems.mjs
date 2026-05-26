import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });

export async function searchItems(event) {
  try {
    const params = event.queryStringParameters || {};
    const query = params.q?.trim();
    const serverId = params.serverId;

    if (!query || !serverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing query or serverId" }),
      };
    }

    const serverKey = `SERVER#${serverId}`;
    const searchKey = query.toUpperCase();

    const result = await db.send(
      new QueryCommand({
        TableName: "Lootlistdb",
        IndexName: "SK-sortName-index",
        KeyConditionExpression: "SK = :sk AND begins_with(#sortName, :q)",
        ExpressionAttributeValues: {
          ":sk": { S: serverKey },
          ":q": { S: searchKey },
        },
        ExpressionAttributeNames: {
          "#sortName": "sortName",
        },
      })
    );

    const results = (result.Items ?? []).map((item) => ({
      name: item.name?.S,
      description: item.description?.S,
      type: item.type?.S ?? "Unknown",
      rarity: item.rarity?.S ?? "Common",
      requiresAttunement: item.requiresAttunement?.S ?? "No",
      marketPrice: Number(item.marketPrice?.N ?? "0"),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ results }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error during search" }),
    };
  }
}

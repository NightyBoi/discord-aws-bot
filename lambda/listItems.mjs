import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-central-1" });

export async function listItems(event) {
  try {
    const params = event.queryStringParameters || {};
    const serverId = params.serverId;

    if (!serverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing server ID" }),
      };
    }

    const serverKey = `SERVER#${serverId}`;
    const expressionNames = {};
    const expressionValues = { ":sk": { S: serverKey } };
    const filterParts = [];

    if (params.name) {
      filterParts.push("contains(#sn, :name)");
      expressionValues[":name"] = { S: params.name.toUpperCase() };
      expressionNames["#sn"] = "sortName";
    }

    if (params.rarity) {
      filterParts.push("rarity = :rar");
      expressionValues[":rar"] = { S: params.rarity };
    }

    if (params.type) {
      filterParts.push("#type = :type");
      expressionValues[":type"] = { S: params.type };
      expressionNames["#type"] = "type";
    }

    if (params.attunement) {
      filterParts.push("requiresAttunement = :att");
      expressionValues[":att"] = { S: params.attunement };
    }

    const queryConfig = {
      TableName: "Lootlistdb",
      IndexName: "serverId-general",
      KeyConditionExpression: "SK = :sk",
      ExpressionAttributeValues: expressionValues,
    };

    if (Object.keys(expressionNames).length > 0) {
      queryConfig.ExpressionAttributeNames = expressionNames;
    }

    if (filterParts.length > 0) {
      queryConfig.FilterExpression = filterParts.join(" AND ");
    }

    const result = await db.send(new QueryCommand(queryConfig));

    const results = (result.Items ?? []).map((item) => ({
      name: item.name?.S,
      type: item.type?.S,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ results }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to list items" }),
    };
  }
}

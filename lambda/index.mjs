import { addItem } from "./addItem.mjs";
import { searchItems } from "./searchItems.mjs";
import { deleteItem } from "./deleteItem.mjs";
import { listItems } from "./listItems.mjs";
import { addItemsBulk } from "./addItemsBulk.mjs";
import { inventoryAdd } from "./addInventory.mjs";
import { inventoryList } from "./listInventory.mjs";
import { inventoryDelete } from "./deleteInventory.mjs";

export const handler = async (event) => {
  const AUTH_SECRET = process.env.LOOTLIST_SECRET;
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (authHeader !== `Bearer ${AUTH_SECRET}`) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  if (method === "POST" && path === "/items/add") return addItem(event);
  if (method === "POST" && path === "/items/bulkadd") return addItemsBulk(event);
  if (method === "GET" && path === "/items/list") return listItems(event);
  if (method === "GET" && path === "/items/search") return searchItems(event);
  if (method === "DELETE" && path === "/items/delete") return deleteItem(event);
  if (method === "POST" && path === "/inv/add") return inventoryAdd(event);
  if (method === "GET" && path === "/inv/list") return inventoryList(event);
  if (method === "DELETE" && path === "/inv/delete") return inventoryDelete(event);

  return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
};

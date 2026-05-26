# Lootlist Bot

A Discord bot for managing D&D loot tables and player inventories. Supports multi-server deployments with per-server item lists and per-user inventories, backed by AWS Lambda and DynamoDB.

## Features

- **Item management** — add, search, list (with filters), and delete items from a server's loot table
- **Bulk import** — upload a CSV to add dozens of items at once
- **Player inventories** — each user has their own inventory; add or remove quantities of any listed item
- **Paginated browsing** — navigate large item lists with buttons; inspect individual items via a select menu
- **Multi-tenant** — each Discord server maintains its own isolated item list and inventories

## Tech Stack

| Layer | Technology |
|---|---|
| Bot client | [discord.js](https://discord.js.org/) v14 |
| API / backend | AWS Lambda (Node.js ESM) |
| Database | AWS DynamoDB (single-table design) |
| Auth | Bearer token via environment variable |
| CSV parsing | [csv-parser](https://github.com/mafintosh/csv-parser) |

## Architecture

```
Discord User
    │
    ▼
Discord Bot (discord.js)          ← runs locally / on a server
    │  slash command interaction
    ▼
AWS Lambda (HTTP API Gateway)     ← stateless REST handlers
    │  DynamoDB SDK
    ▼
AWS DynamoDB                      ← single table, per-server & per-user keys
```

The bot and Lambda are decoupled — the bot translates Discord interactions into simple HTTP requests, and the Lambda handles all data access. This keeps the bot stateless and makes the backend independently testable.

## Project Structure

```
├── index.js                  # Bot entry point, routes commands to handlers
├── deploy-commands.js        # Registers slash commands with Discord
├── commands/
│   ├── item/
│   │   ├── add.js            # /item add
│   │   ├── bulkAdd.js        # /item bulkadd (CSV upload)
│   │   ├── search.js         # /item search + shared embed helpers
│   │   ├── delete.js         # /item delete
│   │   └── list.js           # /item list (paginated, filterable)
│   └── inventory/
│       ├── add.js            # /inv add
│       ├── delete.js         # /inv delete
│       └── list.js           # /inv list (paginated)
└── lambda/
    ├── index.mjs             # Lambda handler — routes requests
    ├── addItem.mjs
    ├── addItemsBulk.mjs
    ├── searchItems.mjs
    ├── listItems.mjs
    ├── deleteItem.mjs
    ├── addInventory.mjs
    ├── listInventory.mjs
    └── deleteInventory.mjs
```

## Commands

### `/item`

| Subcommand | Description |
|---|---|
| `add` | Add or update an item (name, description, type, rarity, attunement, price) |
| `bulkadd` | Bulk import items from a CSV file |
| `search <query>` | Search for an item by name prefix |
| `delete <name>` | Delete an item from the loot table |
| `list` | Browse all items with optional filters (name, rarity, type, attunement) |

### `/inv`

| Subcommand | Description |
|---|---|
| `add <name> [qty]` | Add an item (and optional quantity) to your inventory |
| `delete <name> [qty]` | Remove an item from your inventory |
| `list [user]` | View your inventory, or another user's |

## CSV Format for Bulk Import

```csv
name,description,type,rarity,attunement,price
Flame Tongue,A sword wreathed in fire.,Weapon,Rare,Yes,500
Bag of Holding,A bag with an extradimensional space.,Wondrous Item,Uncommon,No,150
```

## Setup

### Prerequisites

- Node.js 18+
- A Discord application with a bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- AWS account with a Lambda function and DynamoDB table deployed

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_server_id
API_ENDPOINT=https://your-lambda-api-gateway-url
LOOTLIST_SECRET=your_shared_secret
```

### Install & Run

```bash
npm install

# Register slash commands with Discord (run once, or after command changes)
npm run deploy

# Start the bot
npm start
```

## DynamoDB Table Design

The project uses a single DynamoDB table (`Lootlistdb`) with composite keys to support multi-tenant data isolation.

| Entity | PK | SK |
|---|---|---|
| Item | `ITEM#<ITEM_ID>` | `SERVER#<serverId>` |
| Inventory entry | `USER#<userId>` | `SERVER#<serverId>#ITEM#<itemId>` |

A GSI (`SK-sortName-index`) on the item records enables efficient prefix-based name search without a full table scan.

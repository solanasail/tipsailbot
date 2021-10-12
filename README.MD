<h1 align="center">Tip Sail Bot</h1>

<div align="center">
  <strong>Crypto Tipping Bot for the SolanaSail Discord</strong>
</div>

<br />

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Disclaimer](#disclaimer)

## Features
* send SOL, gSAIL, SAIL to public keys or by tagging a discord user
* check your account balance

### Commands
* help
* import-wallet pk
* register-wallet
* balance
* tipsol @user1 @user2 ... amount -m desc
* tipsail @user1 @user2 ... amount -m desc
* tipgsail @user1 @user2 ... amount -m desc

In a public channel, you can use the these commands.
You can also use these commands in a private DM channel with the bot.

## Architecture
### DiscordId -> Public Key Storage
This is a persistent db. All it does is map discordIds to public keys. A user can use a command
to save a public key for their discordId here. Then, users can send that user currency by simply
tagging them in a message instead of having to write the public key.
### Wallet
Regular wallet offering functions such as inspecting balance or sending currency. Forwards calls to
the selected Solana cluster.
### PriceAPI
Provides the current USD value of SOL and some other price-related functions.

## Deployment

### Discord Setup

1. Go to the discord developer portal `https://discord.com/developers/applications` and create a new application
2. Create a new bot. You can also give it an avatar. You'll need the bot token for later!
3. Go to `https://discord.com/oauth2/authorize?client_id=<YOUR_APPLICATION_CLIENT_ID>&scope=bot` to add the bot to your server.

### Local Deployment
1. run `npm install`
2. run `npm install @solana/web3.js`
3. run `npm install @solana/spl-token`
4. run `npm install discord.js axios dotenv`
5. run `npm install base58`
6. add a new `config` folder, inside `config`, add an `index.js` file inside with the following content (DO NOT COMMIT THIS config folder. JUST IGNORE):
  ```
    export const CLUSTERS = {
      MAINNET: 'mainnet-beta',
      TESTNET: 'testnet',
      DEVNET: 'devnet',
    };

    export const COMMAND_PREFIX = '?';

    export const DISCORD_TOKEN=<YOUR_BOT_TOKEN>

    export const gSAIL_TOKEN_ADDRESS=''
    export const SAIL_TOKEN_ADDRESS=''

    export const SOL_Emoji='sol'
    export const SAIL_Emoji='sail'
    export const gSAIL_Emoji='gsail'
  ```
7. Open the cmd and type `node index.js`

## Disclaimer

#### This tipsailbot tool is an experimental unsupported version and it is not recommended for any production use.
#### Changes might occur which impact applications that use this tipsailbot tool.

#### Licensed under the MIT License
#### links to https://github.com/solanasail/tipsailbot/blob/master/LICENSE
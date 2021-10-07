import solanaConnect from './src/solana/index.js'
import Wallet from './src/wallet/index.js'
import PriceService from './src/price/PriceService.js'

import { Client } from 'discord.js'

import wallet from './src/wallet/index.js'

import { CLUSTERS, COMMAND_PREFIX, DISCORD_TOKEN, SOL_FEE_LIMIT } from './config/index.js'
import Utils from './src/utils.js'

import DB from './src/publicKeyStorage/index.js'

let cluster = CLUSTERS.DEVNET;

// Create a new discord client instance
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] });

try {
  // connect to database.
  await DB.connectDB(cluster);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Cannot be able to connect to DB");
  process.exit(1); // exit node.js with an error
}

// When the client is ready, run this code
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
  
client.on('disconnected', function() {
  console.log('Disconnected!');
  process.exit(1); //exit node.js with an error
});

client.on('messageCreate', async (message) => {
  // Ignore the message if the prefix does not fit and if the client authored it.
  if (!message.content.startsWith(COMMAND_PREFIX) || message.author.bot) return;

  let args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
  let command = args[0];
  args = args.slice(1);

  if (command == "register-wallet") { // Register wallet.
    if (message.channel.type != "DM") {
      message.channel.send(
        '🚧 This must be done in a private DM channel 🚧',
      );
      return;
    }

    // create new keypair.
    let account = await solanaConnect.createWallet(message.author.id, cluster);
    
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(account.publicKey, cluster);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(account.privateKey, cluster);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(account.privateKey, cluster);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol.amount);

    message.channel.send(`Cluster: ${cluster}\nAddress: ${account.publicKey}\nBalance: ${sol.amount} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL\n[${account.privateKey}]`);
    return;
  } else if (command == "import-wallet") {
    if (message.channel.type != "DM") {
      message.channel.send(
        '🚧 This must be done in a private DM channel 🚧',
      );
      return;
    }

    if (!args[0]) {
      message.channel.send(
        '🚧 Please input the private key 🚧',
      );
      return;
    }

    // create new keypair.
    let account = await solanaConnect.importWallet(message.author.id, cluster, await Utils.string2Uint8Array(args[0]));
    if (!account.status) {
      message.channel.send(
        '🚧 Invalid private key 🚧',
      );
      return;
    }
        
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(account.publicKey, cluster);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(account.privateKey, cluster);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(account.privateKey, cluster);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol.amount);

    message.channel.send(`Cluster: ${cluster}\nAddress: ${account.publicKey}\nBalance: ${sol.amount} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL\n[${account.privateKey}]`);
    return;
  } else if (command == "help") { // Display help.
    message.channel.send(`${COMMAND_PREFIX}register-wallet\n${COMMAND_PREFIX}import-wallet <PK>\n${COMMAND_PREFIX}balance\n${COMMAND_PREFIX}tipsol <user> <amount>\n${COMMAND_PREFIX}tipsail <user> <amount>\n${COMMAND_PREFIX}tipgsail <user> <amount>`);
    return;
  }

  if (!(await Wallet.getPrivateKey(message.author.id))) { // if you doesn't logged in.
    message.channel.send(
      '🚧 You must register or import your wallet before making transfers 🚧\n🚧 This must be done in a private DM channel 🚧',
    );
    return;
  }

  let publicKey = await Wallet.getPublicKey(message.author.id);

  if (command == "balance") { // See your current available and pending balance.  
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id), cluster);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id), cluster);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol.amount);

    if (message.channel.type == "DM") {
      message.channel.send(`User: <@!${message.author.id}>\nAddress: ${publicKey}\nBalance: ${sol.amount} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL`);
      return;
    }

    message.member.send(`User: <@!${message.author.id}>\nAddress: ${publicKey}\nBalance: ${sol.amount} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL`);
    return;
  } else if (command == "tipsol") { // $tip <user_mention> <amount>: Tip <amount> TLO to <user_mention>
    let validation = await Utils.validateForTipping(args);
    if (!validation.status) {
      message.channel.send(validation.msg);
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount;

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);
    if (sol.amount - amount * recipientIds.length < SOL_FEE_LIMIT * recipientIds.length) {
      message.channel.send(`🚧 Not enough SOL 🚧`);
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];
      
      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        message.channel.send(`🚧 <@!${elem}> dosn't have the wallet 🚧`);
        continue;
      }

      await solanaConnect.transferSOL(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount);

      message.channel.send(`<@!${message.author.id}> sent the ${amount} SOL to <@!${elem}>`);
    }

    return;
  } else if (command == "tipsail") {
    let validation = await Utils.validateForTipping(args);
    if (!validation.status) {
      message.channel.send(validation.msg);
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount;

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);
    if (sol.amount < SOL_FEE_LIMIT) {
      message.channel.send(`🚧 Not enough SOL fee to tip the SAIL 🚧`);
      return;
    }

    const SAIL = await solanaConnect.getSAILBalance(await wallet.getPrivateKey(message.author.id), cluster);
    if (amount * recipientIds.length > SAIL.amount) {
      message.channel.send(`🚧 Not enough SAIL 🚧`)
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];
      
      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        message.channel.send(`🚧 <@!${elem}> dosn't have the wallet 🚧`);
        continue;
      }

      await solanaConnect.transferSAIL(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount);

      message.channel.send(`<@!${message.author.id}> sent the ${amount} SAIL to <@!${elem}>`);
    }

    return;
  } else if (command == "tipgsail") {
    let validation = await Utils.validateForTipping(args);
    if (!validation.status) {
      message.channel.send(validation.msg);
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount;

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);
    if (sol.amount < SOL_FEE_LIMIT) {
      message.channel.send(`🚧 Not enough SOL fee to tip the GSAIL 🚧`);
      return;
    }

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await wallet.getPrivateKey(message.author.id), cluster);
    if (amount * recipientIds.length > gSAIL.amount) {
      message.channel.send(`🚧 Not enough gSAIL 🚧`)
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];
      
      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        message.channel.send(`🚧 <@!${elem}> dosn't have the wallet 🚧`);
        continue;
      }
      
      await solanaConnect.transferGSAIL(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount);

      message.channel.send(`<@!${message.author.id}> sent the ${amount} gSAIL to <@!${elem}>`);
    }

    return;
  }
});

try {
  // Login to Discord with your client's token
  client.login(DISCORD_TOKEN); 
} catch (e) {
  console.error('Client has failed to connect to discord.');
  process.exit(1);
}  
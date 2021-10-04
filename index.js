import solanaConnect from './src/solana/index.js'
import Wallet from './src/wallet/index.js'
import PriceService from './src/price/PriceService.js'

import { Client} from 'discord.js'

import wallet from './src/wallet/index.js'

import { CLUSTERS, COMMAND_PREFIX, DISCORD_TOKEN } from './config/index.js'

let cluster = CLUSTERS.DEVNET;

// Create a new discord bot instance
const bot = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] });

// When the client is ready, run this code
bot.once('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});
  
bot.on('disconnected', function() {
  console.log('Disconnected!');
  process.exit(1); //exit node.js with an error
});

bot.on('messageCreate', async (message) => {
  // Ignore the message if the prefix does not fit and if the bot authored it.
  if (!message.content.startsWith(COMMAND_PREFIX) || message.author.bot) return;

  let args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
  let command = args[0];
  args = args.slice(1)

  if (command == "register-wallet") { // Register wallet.
    // create new keypair.
    let account = await solanaConnect.createWallet(cluster);

    // login with keypair.
    await Wallet.login(message.author.id, account.privateKey, account.publicKey, cluster);
    
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(account.publicKey, cluster);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(account.privateKey, cluster);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(account.privateKey, cluster);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol);

    if (message.channel.type == "DM") {
      message.channel.send(`Cluster: ${cluster}\nAddress: ${account.publicKey}\nBalance: ${sol} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL\n[${account.privateKey}]`);
      return
    }

    message.member.send(`Cluster: ${cluster}\nAddress: ${account.publicKey}\nBalance: ${sol} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL\n[${account.privateKey}]`);
    return;
  } else if (command == "help") { // Display help.
    message.channel.send(".register-wallet\n.balance\n.tip <user> <amount>\n.tipsail <user> <amount>\n.tipgsail <user> <amount>");
    return;
  }

  if (!(await Wallet.isLoggedIn(message.author.id))) { // if you doesn't logged in.
    message.channel.send(
      '🚧 You must register a wallet before making transfers 🚧\n🚧 commands: .register-wallet 🚧',
    );
    return;
  }

  let publicKey = await Wallet.isLoggedIn(message.author.id);

  if (command == "balance") { // See your current available and pending balance.  
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id), cluster);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id), cluster);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol);

    message.channel.send(`Address: ${publicKey}\nBalance: ${sol} SOL (~${dollarValue}$), ${gSAIL.amount} gSAIL, ${SAIL.amount} SAIL`);
    return;
  } else if (command == "tip") { // $tip <user_mention> <amount>: Tip <amount> TLO to <user_mention>
    let splitId = (/(\d+)/).exec(args[0]);
    if (!splitId) {
      message.channel.send(`${args[0]} doen't exist`);
      return;
    }

    let recipientId = splitId[1];

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);

    if (sol - args[1] < 0.05) {
      message.channel.send(`Not enough SOL.`);
      return;
    }

    if (!await Wallet.isLoggedIn(recipientId)) {
      message.channel.send(`Recipient dosn't have the wallet.`)
      return;
    }
    
    await solanaConnect.transfer(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.isLoggedIn(recipientId), args[1]);

    message.channel.send(`I sent the ${args[1]} SOL.`)
    return;
  } else if (command == "tipsail") {
    let splitId = (/(\d+)/).exec(args[0]);
    if (!splitId) {
      message.channel.send(`${args[0]} doen't exist`);
      return;
    }

    let recipientId = splitId[1];

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);

    if (sol < 0.001) {
      message.channel.send(`Not enough SOL fee to tip the SAIL`);
      return;
    }

    const SAIL = await solanaConnect.getSAILBalance(await wallet.getPrivateKey(message.author.id), cluster);

    if (args[1] > SAIL.amount) {
      message.channel.send(`Not enough SAIL.`)
      return;
    }

    if (!await Wallet.isLoggedIn(recipientId)) {
      message.channel.send(`Recipient dosn't have the wallet.`)
      return;
    }

    await solanaConnect.transferSAIL(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.isLoggedIn(recipientId), args[1]);

    message.channel.send(`I sent the ${args[1]} SAIL.`)
    return;
  } else if (command == "tipgsail") {
    let splitId = (/(\d+)/).exec(args[0]);
    if (!splitId) {
      message.channel.send(`${args[0]} doen't exist`);
      return;
    }

    let recipientId = splitId[1];

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey, cluster);

    if (sol < 0.001) {
      message.channel.send(`Not enough SOL fee to tip the GSAIL`);
      return;
    }

    const gSAIL = await solanaConnect.getGSAILBalance(await wallet.getPrivateKey(message.author.id), cluster);

    if (args[1] > gSAIL.amount) {
      message.channel.send(`Not enough gSAIL.`)
      return;
    }

    if (!await Wallet.isLoggedIn(recipientId)) {
      message.channel.send(`Recipient dosn't have the wallet.`)
      return;
    }

    await solanaConnect.transferGSAIL(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.isLoggedIn(recipientId), args[1]);

    message.channel.send(`I sent the ${args[1]} gSAIL.`)
    return;
  }
});

try {
  // Login to Discord with your bot's token
  bot.login(DISCORD_TOKEN); 
} catch (e) {
  console.error('Bot has failed to connect to discord.');
  process.exit(1);
}  
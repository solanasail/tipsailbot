import { CLUSTERS } from './src/config/index.js';
// var web3 = require('@solana/web3.js');
import solanaConnect from './src/solana/index.js';
// var splToken = require('@solana/spl-token');
// let Wallet = require('./src/wallet/index.js');
import Wallet from './src/wallet/index.js';
import PriceService from './src/price/PriceService.js';
import { Client } from 'discord.js';

import { COMMAND_PREFIX } from './src/config/index.js';
import wallet from './src/wallet/index.js';

const bot = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] });

let cluster = CLUSTERS.DEVNET;

bot.on('ready', () => {
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

  if (command == "help") { // Display help.
    message.channel.send(".register-wallet\n.balance\n.airdrop <amount>\n.tip <user> <amount>");
    return;
  } else if (command == "register-wallet") { // Register wallet.
    // create new keypair.
    let account = await solanaConnect.createWallet(cluster);

    // login with keypair.
    await Wallet.login(message.author.id, account.privateKey, account.publicKey, cluster);
    
    const sol = await solanaConnect.getBalance(account.publicKey, cluster);
    const dollarValue = await PriceService.getDollarValueForSol(sol);

    message.member.send(`Cluster: ${cluster}`);
    message.member.send(`Address: ${account.publicKey}`);
    message.member.send(`Balance: ${sol} SOL (~${dollarValue}$)`);
    message.member.send(`[${account.privateKey}]`);
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
    const sol = await solanaConnect.getBalance(publicKey, cluster);
    const dollarValue = await PriceService.getDollarValueForSol(sol);

    message.channel.send(`Address: ${publicKey}\nBalance: ${sol} SOL ${dollarValue ? `(~$${dollarValue})` : ''}`);
    return;
  } else if (command == "tip") { // $tip <user_mention> <amount>: Tip <amount> TLO to <user_mention>
    let recipientId = (/(\d+)/).exec(args[0])[1];
    
    console.log(args[0]);
    console.log(recipientId);

    const sol = await solanaConnect.getBalance(publicKey, cluster);

    if (sol - args[1] <= 0.05) {
      message.channel.send(`Not enough SOL`);
      return;
    }

    if (!await Wallet.isLoggedIn(recipientId)) {
      message.channel.send(`Recipient dosn't have the wallet.`)
      return;
    }
    
    await solanaConnect.transfer(cluster, await wallet.getPrivateKey(message.author.id), await Wallet.isLoggedIn(recipientId), args[1]);

    message.channel.send(`I sent the ${args[1]} SOL to wallet.`)
    return;
  } else if (command == "withdraw") { // $withdraw <amount>: Withdraws <amount> to your registered withdrawal address.
    return;
  }
});

try {
  bot.login('ODkyMTI0Mzk1MDg5Mjk3NDg4.YVIVlg.ZOycFiSPymyjdGEr_-09oEXtzL0'); 
} catch (e) {
  console.error('Bot has failed to connect to discord.');
  process.exit(1);
}  
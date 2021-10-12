import solanaConnect from './src/solana/index.js'
import Wallet from './src/wallet/index.js'
import PriceService from './src/price/PriceService.js'

import { Client, MessageEmbed } from 'discord.js'

import wallet from './src/wallet/index.js'

import {  
  CLUSTERS, 
  COMMAND_PREFIX, 
  DISCORD_TOKEN, 
  SOL_FEE_LIMIT, 
  SAIL_Emoji, 
  gSAIL_Emoji, 
  SOL_Emoji,
  TRANSACTION_DESC
} from './config/index.js'
import Utils from './src/utils.js'

import DB from './src/publicKeyStorage/index.js'

// Create a new discord client instance
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] });
let guild = undefined;

try {
  // connect to database.
  await DB.connectDB(CLUSTERS.DEVNET);
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

  // check the guild
  guild = await Utils.checkGuild(client, guild, message);

  let tmpMsg = (message.content + ' ').split(' -m ');

  let args = tmpMsg[0].slice(COMMAND_PREFIX.length).trim().split(/ +/);
  let command = args[0];
  let desc = TRANSACTION_DESC;
  args = args.slice(1);

  if (tmpMsg[1]) {
    desc = tmpMsg[1];
  }
  
  if (command == "register-wallet") { // Register wallet
    if (message.channel.type != "DM") {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`This must be done in a private DM channel`)]});
      return;
    }

    // create new keypair.
    let account = await solanaConnect.createWallet(message.author.id);
    
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(account.publicKey);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(account.privateKey);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(account.privateKey);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol.amount);

    message.author.send({embeds: [new MessageEmbed()
      .setTitle(`${CLUSTERS.DEVNET}`)
      .setColor("#0099ff")
      .setDescription(`Address: ${account.publicKey}\n\nPrivate Key:\n${await Utils.Uint8Array2String(account.privateKey)}\n\n[${account.privateKey}]\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`)]}).catch(error => {
        console.log(`Cannot send messages to this user`);
      });
    return;
  } else if (command == "import-wallet") { // Import wallet
    if (message.channel.type != "DM") {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`This must be done in a private DM channel`)]});
      return;
    }

    // check the role in private channel
    if (!await Utils.checkRoleInPrivate(guild, message)) {
      message.author.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`You don't have any permission`)]}).catch(error => {
          console.log(`Cannot send messages to this user`);
        });
      return;
    }

    if (!args[0]) {
      message.author.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`Please input the private key`)]}).catch(error => {
          console.log(`Cannot send messages to this user`);
        });
      return;
    }

    // create new keypair.
    let account = await solanaConnect.importWallet(message.author.id, await Utils.string2Uint8Array(args[0]));
    if (!account.status) {
      message.author.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`Invalid private key`)]}).catch(error => {
          console.log(`Cannot send messages to this user`);
        });
      return;
    }
        
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(account.publicKey);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(account.privateKey);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(account.privateKey);

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol.amount);

    message.author.send({embeds: [new MessageEmbed()
      .setTitle(`${CLUSTERS.DEVNET}`)
      .setColor("#0099ff")
      .setDescription(`Address: ${account.publicKey}\n\nPrivate Key:\n${await Utils.Uint8Array2String(account.privateKey)}\n\n[${account.privateKey}]\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`)]} ).catch(error => {
        console.log(`Cannot send messages to this user`);
      });
    return;
  } else if (command == "help") { // Display help
    if (message.channel.type == "DM") {
      return;
    }

    message.author.send({ embeds: [new MessageEmbed()
      .setColor("#0099ff")
      .setTitle('Help')
      .setDescription(
        `${COMMAND_PREFIX}register-wallet\n` + 
        (await Utils.checkRoleInPublic(message) ? `${COMMAND_PREFIX}import-wallet <PK>\n` : ``)  +
        `${COMMAND_PREFIX}balance\n${COMMAND_PREFIX}tipsol <user> <amount> -m <description>\n${COMMAND_PREFIX}tipsail <user> <amount> -m <description>\n${COMMAND_PREFIX}tipgsail <user> <amount> -m <description>`)] }).catch(error => {
        console.log(`Cannot send messages to this user`);
      });
    return;
  }

  if (!(await Wallet.getPrivateKey(message.author.id))) { // if you doesn't logged in
    try {
      await message.channel.send({embeds: [new MessageEmbed()
        .setTitle(`${message.author.tag}`)
        .setColor("#d93f71")
        .setDescription(`You must register or import your wallet before making transfers\nThis must be done in a private DM channel`)]});
    } catch (error) {
      console.log(`${message.author.username}'s behavior was detected.`);
    }
    return;
  }

  let publicKey = await Wallet.getPublicKey(message.author.id);

  if (command == "balance") { // See your current available and pending balance.  
    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));

    // convert the balance to dolar
    const dollarValue = await PriceService.getDollarValueForSol(sol.amount);
    
    message.author.send({embeds: [new MessageEmbed()
      .setAuthor(message.author.tag)
      .setColor("#0099ff")
      .setDescription(`Address: ${publicKey}\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`)]}).catch(error => {
      console.log(`Cannot send messages to this user`);
    });
    return;
  } else if (command == "tipsol") { // $tip <user_mention> <amount>: Tip <amount> TLO to <user_mention>
    let validation = await Utils.validateForTipping(args, desc);
    if (!validation.status) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(validation.msg)]});
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(6);

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);
    if (sol.amount - amount * recipientIds.length < SOL_FEE_LIMIT * recipientIds.length) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription('Not enough SOL')]});
      return;
    }

    if (amount < 0.000001 || 5 < amount) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription('MIN: 0.000001\nMAX: 5')]});
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];
      
      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        await message.channel.send({embeds: [new MessageEmbed()
          .setColor("#d93f71")
          .setDescription(`<@!${elem}> dosn't have the wallet`)]});
        continue;
      }

      // get the balance of gSAIL
      const gSAIL = await solanaConnect.getGSAILBalance(await wallet.getPrivateKey(message.author.id));
      // get the balance of SAIL
      const SAIL = await solanaConnect.getSAILBalance(await wallet.getPrivateKey(message.author.id));

      if (gSAIL.amount < 1 || SAIL.amount < 1) {
        await message.channel.send({embeds: [new MessageEmbed()
          .setColor("#d93f71")
          .setDescription(`You should have at least 1 gSAIL and 1 SAIL`)]});
          return;
      }

      await solanaConnect.transferSOL(await wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount, desc);

      // DM to sender
      message.author.send({embeds: [new MessageEmbed()
        .setColor("#0099ff")
        .setTitle('Tip SOL')
        .setDescription(`You sent ${amount} SOL to <@!${elem}>\n\nDescription:\n${desc}`)]}).catch(error => {
          console.log(`Cannot send messages to this user`);
      });

      try {
        // DM to recipient
        let fetchedUser = await client.users.fetch(elem, false);
        await fetchedUser.send({embeds: [new MessageEmbed()
          .setColor("#0099ff")
          .setTitle('Tip SOL')
          .setDescription(`You received ${amount} SOL from <@!${message.author.id}>\n\nDescription:\n${desc}`)]});
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }
    }

    try {
      let tmpCache = await message.guild.emojis.cache;
      const sol_emoji = tmpCache.find(emoji => emoji.name == SOL_Emoji);
      await message.react(sol_emoji);
    } catch (error) {
      console.log('sol emoji error');
    }
    return;
  } else if (command == "tipsail") {
    let validation = await Utils.validateForTipping(args, desc);
    if (!validation.status) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(validation.msg)]});
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(6);

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);
    if (sol.amount < SOL_FEE_LIMIT) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`Not enough SOL fee to tip the SAIL`)]});
      return;
    }

    const SAIL = await solanaConnect.getSAILBalance(await wallet.getPrivateKey(message.author.id));
    if (amount * recipientIds.length > SAIL.amount) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`Not enough SAIL`)]});
      return;
    }

    if (amount < 0.000001 || 1000 < amount) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription('MIN: 0.000001\nMAX: 1000')]});
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];
      
      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        await message.channel.send({embeds: [new MessageEmbed()
          .setColor("#d93f71")
          .setDescription(`<@!${elem}> dosn't have the wallet`)]});
        continue;
      }

      // get the balance of gSAIL
      const gSAIL = await solanaConnect.getGSAILBalance(await wallet.getPrivateKey(message.author.id));
      // get the balance of SAIL
      const SAIL = await solanaConnect.getSAILBalance(await wallet.getPrivateKey(message.author.id));

      if (gSAIL.amount < 1 || SAIL.amount < 1) {
        await message.channel.send({embeds: [new MessageEmbed()
          .setColor("#d93f71")
          .setDescription(`You should have at least 1 gSAIL and 1 SAIL`)]});
          return;
      }

      await solanaConnect.transferSAIL(await wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount, desc);

      // DM to sender
      message.author.send({embeds: [new MessageEmbed()
        .setColor("#0099ff")
        .setTitle('Tip SAIL')
        .setDescription(`You sent ${amount} SAIL to <@!${elem}>\n\nDescription:\n${desc}`)]}).catch(error => {
          console.log(`Cannot send messages to this user`);
      });

      try {
        // DM to recipient
        let fetchedUser = await client.users.fetch(elem, false);
        await fetchedUser.send({embeds: [new MessageEmbed()
          .setColor("#0099ff")
          .setTitle('Tip SAIL')
          .setDescription(`You received ${amount} SAIL from <@!${message.author.id}>\n\nDescription:\n${desc}`)]});
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }
    }
    
    try {
      let tmpCache = await message.guild.emojis.cache;
      const sail_emoji = tmpCache.find(emoji => emoji.name == SAIL_Emoji);
      await message.react(sail_emoji);
    } catch (error) {
      console.log('sail emoji error');
    }
    return;
  } else if (command == "tipgsail") {
    let validation = await Utils.validateForTipping(args, desc);
    if (!validation.status) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(validation.msg)]});
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(9);

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);
    if (sol.amount < SOL_FEE_LIMIT) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`Not enough SOL fee to tip the GSAIL`)]});
      return;
    }

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await wallet.getPrivateKey(message.author.id));
    if (amount * recipientIds.length > gSAIL.amount) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription(`Not enough GSAIL`)]});
      return;
    }

    if (amount < 0.000000001 || 100 < amount) {
      await message.channel.send({embeds: [new MessageEmbed()
        .setColor("#d93f71")
        .setDescription('MIN: 0.000000001\nMAX: 100')]});
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];
      
      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        await message.channel.send({embeds: [new MessageEmbed()
          .setColor("#d93f71")
          .setDescription(`<@!${elem}> dosn't have the wallet`)]});
        continue;
      }
      
      // get the balance of gSAIL
      const gSAIL = await solanaConnect.getGSAILBalance(await wallet.getPrivateKey(message.author.id));
      // get the balance of SAIL
      const SAIL = await solanaConnect.getSAILBalance(await wallet.getPrivateKey(message.author.id));

      if (gSAIL.amount < 1 || SAIL.amount < 1) {
        await message.channel.send({embeds: [new MessageEmbed()
          .setColor("#d93f71")
          .setDescription(`You should have at least 1 gSAIL and 1 SAIL`)]});
          return;
      }
      
      await solanaConnect.transferGSAIL(await wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount, desc);

      // DM to sender
      message.author.send({embeds: [new MessageEmbed()
        .setColor("#0099ff")
        .setTitle('Tip gSAIL')
        .setDescription(`You sent ${amount} gSAIL to <@!${elem}>\n\nDescription:\n${desc}`)]}).catch(error => {
          console.log(`Cannot send messages to this user`);
      });

      try {
        // DM to recipient
        let fetchedUser = await client.users.fetch(elem, false);
        await fetchedUser.send({embeds: [new MessageEmbed()
          .setColor("#0099ff")
          .setTitle('Tip gSAIL')
          .setDescription(`You received ${amount} gSAIL from <@!${message.author.id}>\n\nDescription:\n${desc}`)]});
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }
    }

    try {
      let tmpCache = await message.guild.emojis.cache;
      const gsail_emoji = tmpCache.find(emoji => emoji.name == gSAIL_Emoji);
      await message.react(gsail_emoji);
    } catch (error) {
      console.log('gsail emoji error');
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
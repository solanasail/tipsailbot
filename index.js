import solanaConnect from './src/solana/index.js'
import Wallet from './src/wallet/index.js'
import PriceService from './src/price/PriceService.js'

import { Client, MessageEmbed, MessageReaction, User } from 'discord.js'

import {
  ACTIVE_CLUSTER,
  COMMAND_PREFIX,
  DISCORD_TOKEN,
  SOL_FEE_LIMIT,
  SAIL_Emoji,
  gSAIL_Emoji,
  SOL_Emoji,
  TRANSACTION_DESC,
  GUILD_ID,
  LOG_CHANNEL_ID,
} from './config/index.js'
import Utils from './src/utils.js'

import DB from './src/publicKeyStorage/index.js'

// Create a new discord client instance
const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", 'GUILD_MESSAGE_REACTIONS'],
  partials: ["CHANNEL"]
});
let guild = undefined;

let dangerColor = '#d93f71';
let infoColor = '#0099ff';

try {
  // connect to database.
  await DB.connectDB(ACTIVE_CLUSTER);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Cannot be able to connect to DB");
  process.exit(1); // exit node.js with an error
}

// When the client is ready, run this code
client.once('ready', async () => {
  guild = await client.guilds.fetch(GUILD_ID);
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('disconnected', function () {
  console.log('Disconnected!');
  process.exit(1); //exit node.js with an error
});

client.on('messageCreate', async (message) => {

  // Ignore the message if the prefix does not fit and if the client authored it.
  if (!message.content.startsWith(COMMAND_PREFIX) || message.author.bot) return;

  let tmpMsg = (message.content + ' ').split(' -m ');

  let args = tmpMsg[0].slice(COMMAND_PREFIX.length).trim().split(/ +/);

  let command = args[0];
  args = args.slice(1);

  let desc = tmpMsg[1] ?? TRANSACTION_DESC;

  if (command == "register-wallet") { // Register wallet
    if (message.channel.type != "DM") {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`This must be done in a private DM channel`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
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
    const dollarValue = parseFloat(await PriceService.getDollarValueForSol(sol.amount)) + parseFloat(await PriceService.getDollarValueForGSail(gSAIL.amount)) + parseFloat(await PriceService.getDollarValueForSail(SAIL.amount));

    await message.author.send({
      embeds: [new MessageEmbed()
        .setTitle(`Active Cluster: ${ACTIVE_CLUSTER}`)
        .setColor(infoColor)
        .setDescription(`Address: ${account.publicKey}\n\nPrivate Key:\n${await Utils.Uint8Array2String(account.privateKey)}\n\n[${account.privateKey}]\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`)]
    }).catch(error => {
      console.log(`Cannot send messages to this user`);
    });
    return;
  } else if (command == "import-wallet") { // Import wallet
    if (message.channel.type != "DM") {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`This must be done in a private DM channel`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    // check the role in private channel
    if (!await Utils.checkRoleInPrivate(guild, message)) {
      await message.author.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`You don't have any permission`)]
      }).catch(error => {
        console.log(`Cannot send messages to this user`);
      });
      return;
    }

    if (!args[0]) {
      await message.author.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Please input the private key`)]
      }).catch(error => {
        console.log(`Cannot send messages to this user`);
      });
      return;
    }

    // create new keypair.
    let account = await solanaConnect.importWallet(message.author.id, await Utils.string2Uint8Array(args[0]));
    if (!account.status) {
      await message.author.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Invalid private key`)]
      }).catch(error => {
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
    const dollarValue = parseFloat(await PriceService.getDollarValueForSol(sol.amount)) + parseFloat(await PriceService.getDollarValueForGSail(gSAIL.amount)) + parseFloat(await PriceService.getDollarValueForSail(SAIL.amount));

    await message.author.send({
      embeds: [new MessageEmbed()
        .setTitle(`Active Cluster: ${ACTIVE_CLUSTER}`)
        .setColor(infoColor)
        .setDescription(`Address: ${account.publicKey}\n\nPrivate Key:\n${await Utils.Uint8Array2String(account.privateKey)}\n\n[${account.privateKey}]\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`)]
    }).catch(error => {
      console.log(`Cannot send messages to this user`);
    });
    return;
  } else if (command == "helptip") { // Display help
    if (message.channel.type == "DM") {
      return;
    }

    await message.author.send({
      embeds: [new MessageEmbed()
        .setColor(infoColor)
        .setTitle('Help')
        .setDescription(
          `${COMMAND_PREFIX}register-wallet\n` +
          (await Utils.checkRoleInPublic(message) ? `${COMMAND_PREFIX}import-wallet <PK>\n` : ``) +
          `${COMMAND_PREFIX}balance\n${COMMAND_PREFIX}tipsol <user> <amount> -m <description>\n${COMMAND_PREFIX}tipsail <user> <amount> -m <description>\n${COMMAND_PREFIX}tipgsail <user> <amount> -m <description>\n\n${COMMAND_PREFIX}raingsail <amount> <max people>\n${COMMAND_PREFIX}rainsail <amount> <max people>`)]
    }).catch(error => {
      console.log(`Cannot send messages to this user`);
    });
    return;
  }

  if (!(await Wallet.getPrivateKey(message.author.id))) { // if you doesn't logged in
    try {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setTitle(`${message.author.tag}`)
          .setColor(dangerColor)
          .setDescription(`You must register or import your wallet before making transfers\nThis must be done in a private DM channel`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
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
    const dollarValue = parseFloat(await PriceService.getDollarValueForSol(sol.amount)) + parseFloat(await PriceService.getDollarValueForGSail(gSAIL.amount)) + parseFloat(await PriceService.getDollarValueForSail(SAIL.amount));

    await message.author.send({
      embeds: [new MessageEmbed()
        .setAuthor(message.author.tag)
        .setColor(infoColor)
        .setDescription(`Active Cluster: ${ACTIVE_CLUSTER}\nAddress: ${publicKey}\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`)]
    }).catch(error => {
      console.log(`Cannot send messages to this user`);
    });
    return;
  } else if (command == "tipsol") { // $tip <user_mention> <amount>: Tip <amount> TLO to <user_mention>
    if (message.channel.type == "DM") {
      return;
    }

    let validation = await Utils.validateForTipping(args, desc);
    if (!validation.status) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(validation.msg)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(6);

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);
    if (sol.amount - amount * recipientIds.length < SOL_FEE_LIMIT * recipientIds.length) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription('Not enough SOL')]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    if (amount < 0.000001 || 5 < amount) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription('MIN: 0.000001\nMAX: 5')]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];

      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`<@!${elem}> doesn't have the wallet`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        continue;
      }

      // get the balance of gSAIL
      const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));
      // get the balance of SAIL
      const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));

      if (gSAIL.amount < 1 || SAIL.amount < 1) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`You should have at least 1 gSAIL and 1 SAIL`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }

      const {success, error, signature,} = await solanaConnect.transferSOL(await Wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount, desc);

      let msgToSender, msgToRecipient
      if( success ) {
        msgToSender    = `You sent ${amount} SOL to <@!${elem}>\nTransaction: ${ solanaConnect.txLink(signature) }` + ( desc ? `\n\nDescription:\n${desc}` : '')
        msgToRecipient = `You received ${amount} SOL from <@!${message.author.id}>\nTransaction: ${ solanaConnect.txLink(signature) }` + ( desc ? `\n\nDescription:\n${desc}` : '')
      } else {
        msgToSender    = `Could not send SOL to <@!${elem}>\n\nError:\n${error}`
        msgToRecipient = `Failed to receive SOL from <@!${message.author.id}>\n\nError:\n${error}`
      }
      // DM to sender
      await message.author.send({
        embeds: [new MessageEmbed()
          .setColor(infoColor)
          .setTitle('Tip SOL')
          .setDescription(msgToSender)]
      }).catch(error => {
        console.log(`Cannot send messages to this user`);
      });

      try {
        // DM to recipient
        let fetchedUser = await client.users.fetch(elem, false);
        await fetchedUser.send({
          embeds: [new MessageEmbed()
            .setColor(infoColor)
            .setTitle('Tip SOL')
            .setDescription(msgToRecipient)]
        });
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }
    }

    try {
      let tmpCache = await message.guild.emojis.cache;
      const sol_emoji = tmpCache.find(emoji => emoji.name == SOL_Emoji);
      await message.react(sol_emoji);
    } catch (error) {
      console.log(`Sol emoji error: ${error}`);
    }
    return;
  } else if (command == "tipsail") {
    if (message.channel.type == "DM") {
      return;
    }

    let validation = await Utils.validateForTipping(args, desc);
    if (!validation.status) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(validation.msg)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(6);

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);
    if (sol.amount < SOL_FEE_LIMIT) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Not enough SOL fee to tip the SAIL`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));
    if (amount * recipientIds.length > SAIL.amount) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Not enough SAIL`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    if (amount < 0.000001 || 1000 < amount) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription('MIN: 0.000001\nMAX: 1000')]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];

      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`<@!${elem}> doesn't have the wallet`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        continue;
      }

      // get the balance of gSAIL
      const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));
      // get the balance of SAIL
      const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));

      if (gSAIL.amount < 1 || SAIL.amount < 1) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`You should have at least 1 gSAIL and 1 SAIL`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }

      const {success, error, signature,} = await solanaConnect.transferSAIL(await Wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount, desc);

      let msgToSender, msgToRecipient
      if( success ) {
        msgToSender    = `You sent ${amount} SAIL to <@!${elem}>\nTransaction: ${ solanaConnect.txLink(signature) }` + ( desc ? `\n\nDescription:\n${desc}` : '')
        msgToRecipient = `You received ${amount} SAIL from <@!${message.author.id}>\nTransaction: ${ solanaConnect.txLink(signature) }` + ( desc ? `\n\nDescription:\n${desc}` : '')
      } else {
        msgToSender    = `Could not send SAIL to <@!${elem}>\n\nError:\n${error}`
        msgToRecipient = `Failed to receive SAIL from <@!${message.author.id}>\n\nError:\n${error}`
      }
      // DM to sender
      await message.author.send({
        embeds: [new MessageEmbed()
          .setColor(infoColor)
          .setTitle('Tip SAIL')
          .setDescription(msgToSender)]
      }).catch(error => {
        console.log(`Cannot send messages to this user`);
      });

      try {
        // DM to recipient
        let fetchedUser = await client.users.fetch(elem, false);
        await fetchedUser.send({
          embeds: [new MessageEmbed()
            .setColor(infoColor)
            .setTitle('Tip SAIL')
            .setDescription(msgToRecipient)]
        });
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }
    }

    try {
      let tmpCache = await message.guild.emojis.cache;
      const sail_emoji = tmpCache.find(emoji => emoji.name == SAIL_Emoji);
      await message.react(sail_emoji);
    } catch (error) {
      console.log(`Sail emoji error: ${error}`);
    }
    return;
  } else if (command == "tipgsail") {
    if (message.channel.type == "DM") {
      return;
    }

    let validation = await Utils.validateForTipping(args, desc);
    if (!validation.status) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(validation.msg)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(9);

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(publicKey);
    if (sol.amount < SOL_FEE_LIMIT) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Not enough SOL fee to tip the GSAIL`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));
    if (amount * recipientIds.length > gSAIL.amount) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Not enough GSAIL`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    if (amount < 0.000000001 || 100 < amount) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription('MIN: 0.000000001\nMAX: 100')]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    for (let i = 0; i < recipientIds.length; i++) {
      const elem = recipientIds[i];

      // if the recipient doesn't have the wallet
      if (!await Wallet.getPublicKey(elem)) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`<@!${elem}> doesn't have the wallet`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        continue;
      }

      // get the balance of gSAIL
      const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));
      // get the balance of SAIL
      const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));

      if (gSAIL.amount < 1 || SAIL.amount < 1) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`You should have at least 1 gSAIL and 1 SAIL`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }

      const {success, error, signature,} = await solanaConnect.transferGSAIL(await Wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(elem), amount, desc);

      let msgToSender, msgToRecipient
      if( success ) {
        msgToSender    = `You sent ${amount} gSAIL to <@!${elem}>\nTransaction: ${ solanaConnect.txLink(signature) }` + ( desc ? `\n\nDescription:\n${desc}` : '')
        msgToRecipient = `You received ${amount} gSAIL from <@!${message.author.id}>\nTransaction: ${ solanaConnect.txLink(signature) }` + ( desc ? `\n\nDescription:\n${desc}` : '')
      } else {
        msgToSender    = `Could not send gSAIL to <@!${elem}>\n\nError:\n${error}`
        msgToRecipient = `Failed to receive gSAIL from <@!${message.author.id}>\n\nError:\n${error}`
      }
      // DM to sender
      await message.author.send({
        embeds: [new MessageEmbed()
          .setColor(infoColor)
          .setTitle('Tip gSAIL')
          .setDescription(msgToSender)]
      }).catch(error => {
        console.log(`Cannot send messages to this user`);
      });

      try {
        // DM to recipient
        let fetchedUser = await client.users.fetch(elem, false);
        await fetchedUser.send({
          embeds: [new MessageEmbed()
            .setColor(infoColor)
            .setTitle('Tip gSAIL')
            .setDescription(msgToRecipient)]
        });
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }
    }

    try {
      let tmpCache = await message.guild.emojis.cache;
      const gsail_emoji = tmpCache.find(emoji => emoji.name == gSAIL_Emoji);
      await message.react(gsail_emoji);
    } catch (error) {
      console.log(`gSail emoji error: ${error}`);
    }
    return;
  } else if (command == "rainsail" || command == "raingsail") {
    if (message.channel.type == "DM") {
      return;
    }

    const label = (command == 'rainsail') ? 'SAIL' : 'gSAIL';

    let validation = await Utils.validateForRaining(args);

    if (!validation.status) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(validation.msg)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    let amount = validation.amount;
    let maxPeople = validation.maxPeople;

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));
    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));

    // validate SAIL
    if (label == "SAIL") {
      if (amount > SAIL.amount) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`Not enough ${label}`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }

      if (amount < 1 || 1000 < amount) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`SAIL must be between 1 to 1000`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }
    }

    // validate gSAIL
    if (label == "gSAIL") {
      if (amount > gSAIL.amount) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`Not enough ${label}`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }

      if (amount < 1 || 100 < amount) {
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(dangerColor)
            .setDescription(`gSAIL must be between 1 to 100`)]
        }).catch(error => {
          console.log(`Cannot send messages`);
        });
        return;
      }
    }

    // validate the max people
    if (maxPeople < 1 || 40 <= maxPeople) {
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(dangerColor)
          .setDescription(`Max people must be between 1 to 40`)]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
      return;
    }

    const boardInfo = {
      collector: null,
      investor: message.author.id,
      limit: maxPeople,
      amount: 0,
      users: [],
      uiMain: null,
      uiLog: null,
    }

    boardInfo.uiMain = await message.channel.send({
      embeds: [new MessageEmbed()
        .setTitle(`Rain ${label}`)
        .setColor(infoColor)
        .addFields(
          { name: `Prize`, value: `${amount} ${label}`, inline: true },
          { name: `People`, value: `${boardInfo.users.length} / ${maxPeople}`, inline: true },
        )
        .setDescription(`Do you like it?`)]
    }).catch(error => {
      console.log(`Cannot send messages`);
    });
    await boardInfo.uiMain.react("✅");

    if( message.channel.id !=  LOG_CHANNEL_ID ) {
      boardInfo.uiLog = await guild.channels.cache.get(LOG_CHANNEL_ID).send({
        embeds: [new MessageEmbed()
          .setTitle(`Rain ${label}`)
          .setColor(infoColor)
          .addFields(
            { name: `Prize`, value: `${amount} ${label}`, inline: true },
            { name: `People`, value: `${boardInfo.users.length} / ${maxPeople}`, inline: true },
          ) ]
      }).catch(error => {
        console.log(`Cannot send messages`);
      });
    } else {
      boardInfo.uiLog = boardInfo.uiMain
    }

    const filter = (reaction, user) => !user.bot && user.id != boardInfo.investor && ["✅"].includes(reaction.emoji.name);
    boardInfo.collector = boardInfo.uiMain.createReactionCollector({ filter });


    boardInfo.collector.on('collect', async (reaction, user) => {
      if (boardInfo.users.findIndex((elem) => elem.id == user.id) != -1 || boardInfo.limit <= boardInfo.users.length) {
        return;
      }

      const transfer = ( label == 'SAIL')  ? solanaConnect.transferSAIL  :
                       ( label == 'gSAIL') ? solanaConnect.transferGSAIL :
                       ( label == 'SOL')   ? solanaConnect.transferSOL   : null, // in case rainsol is ever added ;D
        {success, error, signature,} = await transfer( await Wallet.getPrivateKey(boardInfo.investor),
                                                       await Wallet.getPublicKey(user.id),
                                                       amount / maxPeople, `Rain ${label}` )

      let fetchedUser = await client.users.fetch(user.id, false);
      
      if( !success ) {
        console.log(`Error while raining ${label}`, error)

        try {
           await fetchedUser.send({
            embeds: [new MessageEmbed()
              .setColor(errorColor)
              .setTitle(`Rain ${label} Error`)
              .setDescription(error)
            ]
          });
        } catch (error) {
          console.log(`Cannot send messages to this user`);
        }        
        
        return;
      }

      boardInfo.users.push(user)
      
      const msg = `You received ${amount / maxPeople} ${label}\nTransaction: ${ solanaConnect.txLink(signature) }`
      try {
        // DM to recipient
        await fetchedUser.send({
          embeds: [new MessageEmbed()
            .setColor(infoColor)
            .setTitle(`Rain ${label}`)
            .setDescription(msg)
          ]
        });
      } catch (error) {
        console.log(`Cannot send messages to this user`);
      }

      let userList = ''
      for (let i = 0; i < boardInfo.users.length; i++) {
        const user = boardInfo.users[i];
        userList += user.username + ` received ${amount / maxPeople} ${label}` + '\n'
      }

      if( boardInfo.uiMain != boardInfo.uiLog ) {
        boardInfo.uiMain.edit({
          embeds: [new MessageEmbed()
            .setTitle(`Rain ${label}`)
            .setColor(infoColor)
            .addFields(
              { name: `Prize`, value: `${amount} ${label}`, inline: true },
              { name: `People`, value: `${boardInfo.users.length} / ${maxPeople}`, inline: true },
            )
          ]
        })
      }

      boardInfo.uiLog.edit({
        embeds: [new MessageEmbed()
          .setTitle(`Rain ${label}`)
          .setColor(infoColor)
          .addFields(
            { name: `Prize`, value: `${amount} ${label}`, inline: true },
            { name: `People`, value: `${boardInfo.users.length} / ${maxPeople}`, inline: true },
          )
          .setDescription(userList)
        ]
      })
    })
  }
});

try {
  // Login to Discord with your client's token
  client.login(DISCORD_TOKEN);
} catch (e) {
  console.error('Client has failed to connect to discord.');
  process.exit(1);
}

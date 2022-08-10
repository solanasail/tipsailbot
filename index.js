import solanaConnect from './src/solana/index.js'
import Wallet from './src/wallet/index.js'
import PriceService from './src/price/PriceService.js'

import { Client, MessageEmbed, } from 'discord.js'

import {
  ACTIVE_CLUSTER,
  SOL_FEE_LIMIT,
  TOKEN_RAIN_LIMITS, TOKEN_TIP_LIMITS,
  TOKEN_LIST,
  TOKENS_REQUIRED,

  COMMAND_PREFIX,
  GUILD_ID,
  DISCORD_TOKEN,
  LOG_CHANNEL_ID,
  HELPMSG_URL,
  INTERVAL,

  SAIL_Emoji, gSAIL_Emoji, SOL_Emoji,
  TRANSACTION_DESC,
} from './config/index.js'

import Utils from './src/utils.js'
import { discord, removeItem, msToHMS, } from './src/utils.js'

import DB from './src/publicKeyStorage/index.js'

// Create a new discord client instance
const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", 'GUILD_MESSAGE_REACTIONS'],
  partials: ["CHANNEL"]
});

let guild = undefined;

const BOT_COMMANDS = ['helptip', 'balance', 'import-wallet', 'register-wallet', 'info',
                      'tipsol', 'tipsail', 'tipgsail', 'rainsail', 'raingsail',
                      'h', 'iw', 'rw', 'b', 'ts', 'tg', 'rs', 'rg'];

try {
  // connect to database.
  await DB.connectDB(ACTIVE_CLUSTER);
  console.log("Connected to MongoDB");
} catch( error ) {
  console.log(`Can't connect to the DB.\n${error}\nstack: ${error.stack}`);
  process.exit(1); // exit node.js with an error
}

process.on( 'unhandledRejection', error => {
	console.log(`Exception was not properly handled!!\n${error}\nstack: ${error.stack}`);
  // process.exit(2); //exit node.js with an error
});

client.on( 'disconnected', _ => {
  console.log('Disconnected!');
  process.exit(1); //exit node.js with an error
});

// When the client is ready, run this code
client.once('ready', async _ => {
  guild = await client.guilds.fetch(GUILD_ID);
  console.log(`Logged in as ${ client.user.tag }!`);
});

client.on('messageCreate', async (message) => {

  // Ignore the message if doesn't contain the prefix or is a bot.
  if( !message.content.startsWith(COMMAND_PREFIX) || message.author.bot ) return;

  let tmpMsg = (message.content + ' ').split(' -m '); // Split message if message parameter present

  let cmdWithArgs = tmpMsg[0].slice(COMMAND_PREFIX.length).trim(); // Remove COMMAND_PREFIX and start and trailing spaces
  let desc = tmpMsg[1] ?? TRANSACTION_DESC;

  let command = cmdWithArgs.split(/ +/, 1)[0].toLowerCase();
  let args    = cmdWithArgs.slice(command.length).trim().split(/ +/);

//  console.log(`\nUser: ${ message.author.username }\nMessage content: ${ message.content }\n`+
//              `Comment: ${desc}\nContent without comment: ${ tmpMsg[0] }\n`+
//              `Cmd With Args after some cleaning: ${cmdWithArgs}\nCommand: ${command}\nArgs: ${args}\n`);

  // Ignore the message if the command is not in the list of registered commands
  if( BOT_COMMANDS.findIndex( cmd => cmd === command) == -1 ) {
    await discord.error( message.channel, {
      description: `"${command}" is not a valid command!\n\n`+
                   `Valid commands: helptip, info, balance, import-wallet, register-wallet, tipsol, tipsail, tipgsail, rainsail, raingsail\n\n`+
                   `Please type ?helptip or read about it on [❓│faq](${HELPMSG_URL})`,
    });

    if( message.channel.type != "DM" ) {
      discord.deleteMessage( message, INTERVAL.short )
    }

    return;
  }

  if( command == "info" ) {
    if( message.channel.type != "DM" ) {
      discord.deleteMessage( message, INTERVAL.short )
    }

    let text = `** TipBot uptime:** ${ msToHMS(client.uptime) }\n\n` +
               `** TipBot ready at:** ${ client.readyAt }\n\n` +
               `** Active Cluster:** ${ACTIVE_CLUSTER}\n\n` +
               `** TipBot supported tokens:**\n\n`

    TOKEN_LIST.forEach( token => {
      text = text + `name: ${token.name}\nSymbol: ${token.symbol}\nAddress: ${ token.address[ACTIVE_CLUSTER] }\n\n`
    } )
    // console.log(text)

    discord.send( message.channel, {
      title: `Useful info`,
      description: text,
      autoHide: INTERVAL.short,
    });
    return;

  } else if( command == "register-wallet" || command == "rw" ) { // Register wallet

    if( message.channel.type != "DM" ) {
      await discord.error( message.channel, { description: `This must be done in a private DM channel` } )
      discord.deleteMessage( message, INTERVAL.short )
      return;
    }

    // create new keypair.
    let account = await solanaConnect.createWallet( message.author.id );

    // get the balance of sol
    const sol = await solanaConnect.getSolBalance(account.publicKey);

    // get the balance of gSAIL
    const gSAIL = await solanaConnect.getGSAILBalance(account.privateKey);

    // get the balance of SAIL
    const SAIL = await solanaConnect.getSAILBalance(account.privateKey);

    // convert the balance to dolar
    const dollarValue = parseFloat( await PriceService.getDollarValueForSol(sol.amount)) + parseFloat(await PriceService.getDollarValueForGSail(gSAIL.amount)) + parseFloat(await PriceService.getDollarValueForSail(SAIL.amount));

    discord.send( message.author, {
      title: `Active Cluster: ${ACTIVE_CLUSTER}`,
      description: `Address: ${ account.publicKey }\n\nPrivate Key:\n${await Utils.Uint8Array2String(account.privateKey) }\n\n[${ account.privateKey }]\n\nSOL: ${ sol.amount }\ngSAIL: ${ gSAIL.amount }\nSAIL: ${ SAIL.amount }\n\nTotal: ${dollarValue}$`,
    });
    return;
  } else if( command == "import-wallet" || command == 'iw' )  { // Import wallet

    if( message.channel.type != "DM" ) {
      await discord.error( message.channel, { description: `This must be done in a private DM channel`, });
      discord.deleteMessage( message, INTERVAL.short )
      return;
    }

    // check the role in private channel
    if( !await Utils.checkRoleInPrivate(guild, message) ) {
      discord.error( message.author, { description: `You don't have any permission` });
      return;
    }

    if( !args[0] ) {
      discord.error( message.author, { description: `Please input the private key` });
      return;
    }

    // create new keypair.
    let account = await solanaConnect.importWallet( message.author.id, await Utils.string2Uint8Array(args[0]));
    if( !account.status) {
      discord.error( message.author, { description: `Invalid private key`, });
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

    await discord.send( message.author, {
      title: `Active Cluster: ${ACTIVE_CLUSTER}`,
      description: `Address: ${account.publicKey}\n\nPrivate Key:\n${await Utils.Uint8Array2String(account.privateKey)}\n\n[${account.privateKey}]\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`,
    });

    return;
  } else if( command == "helptip" || command == "h") { // Display help

    if( message.channel.type != "DM" ) {
      discord.deleteMessage( message, INTERVAL.short )
    }

    let title = `TiSailBot Help`;

    /*
               `\`\`\`diff\n+Text\n\`\`\`` // Green text
               `\`\`\`diff\n-Text\n\`\`\`` // Red text
               `\`\`\`fix\n+Text\n\`\`\``  // Yellow text
               `[Some Text](https://discord.com/channels/xxx)` // Hyperlink

    */
    let text = `**Create/Import wallet:**\n` +
               `\`${COMMAND_PREFIX}register-wallet\` *(alias: rw)*\n` +
               `\`${COMMAND_PREFIX}import-wallet <PK>\` *(alias: iw)*\n\n` +
               `**General commands:**\n` +
               `\`${COMMAND_PREFIX}help\` *(alias: h) (This cmd!)*\n`+
               `\`${COMMAND_PREFIX}info\`\n`+
               `\`${COMMAND_PREFIX}balance\` *(alias: b)*\n\n`+
               `**Tipping commands:**\n` +
               `\`${COMMAND_PREFIX}tipsol <user> <amount> -m <description>\`\n`+
               `\`${COMMAND_PREFIX}tipsail <user> <amount> -m <description>\` *(alias: ts)*\n`+
               `\`${COMMAND_PREFIX}tipgsail <user> <amount> -m <description>\` *(alias: tg)*\n\n`+
               `**Rain commands:**\n` +
               `\`${COMMAND_PREFIX}raingsail <amount> <max people>\` *(alias: rg)*\n`+
               `\`${COMMAND_PREFIX}rainsail <amount> <max people>\` *(alias: rs)*`;

    await discord.send( message.author, {
      title,
      url: HELPMSG_URL,
      description: text,
      autoHide: INTERVAL.normal,
    });

    return;
  }

  if( command == "balance" || command == "b" ) { // See your current available and pending balance.
    if( message.channel.type != "DM" ) {
      discord.deleteMessage( message, INTERVAL.short )
    }

    const { success, publicKey, sol, gSAIL, SAIL, } = await getBalances( message.author, message.channel );

    if( success ) {
      // convert the balance to dolar
      const dollarValue = parseFloat(await PriceService.getDollarValueForSol(sol.amount)) +
                          parseFloat(await PriceService.getDollarValueForGSail(gSAIL.amount)) +
                          parseFloat(await PriceService.getDollarValueForSail(SAIL.amount));

      discord.send( message.author, {
        author: message.author.tag,
        description: `Active Cluster: ${ACTIVE_CLUSTER}\nAddress: ${publicKey}\n\nSOL: ${sol.amount}\ngSAIL: ${gSAIL.amount}\nSAIL: ${SAIL.amount}\n\nTotal: ${dollarValue}$`,
      });
    }

    return;
  } else if( command == "tipsol" ) { // $tip <user_mention> <amount>: Tip <amount> TLO to <user_mention>
    if( message.channel.type == "DM" ) {
      return;
    } else {
      discord.deleteMessage( message, INTERVAL.long ) // TOUPDATE !
    }

    let validation = await Utils.validateForTipping(args, desc);
    if( !validation.status ) {
      await discord.error( message.channel, { description: validation.msg, });
      discord.react( message, undefined, undefined );
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(6);

    const { success, publicKey, sol, gSAIL, SAIL, } = await getBalances( message.author, message.channel);

    if( success ) {
      if( sol.amount - amount * recipientIds.length < SOL_FEE_LIMIT * recipientIds.length ) {
        await discord.error( message.channel, { description: 'Not enough SOL', });
        return;
      }

      if( amount < TOKEN_TIP_LIMITS.$SOL.min || TOKEN_TIP_LIMITS.$SOL.max < amount ) { // Check tipping limits
        await discord.error( message.channel, { description: `Minimum amount: ${ TOKEN_TIP_LIMITS.$SOL.min }\nMaximum amount: ${ TOKEN_TIP_LIMITS.$SOL.max }`, });
        return;
      }

      for( const id of recipientIds ) {
        if( !await Wallet.getPublicKey(id) ) { // if the recipient doesn't have wallet
          await discord.error( message.channel, { description: `<@!${id}> doesn't have a Solana wallet`, });
          continue;
        }

        if( gSAIL.amount < TOKENS_REQUIRED.$gSAIL || SAIL.amount < TOKENS_REQUIRED.$SAIL ) { // Check for minimun required tokens
          await discord.error( message.channel, { description: `You should have at least ${ TOKENS_REQUIRED.$gSAIL } gSAIL and ${ TOKENS_REQUIRED.$SAIL } SAIL`, });
          return;
        }

        const { success, error, signature, } = await solanaConnect.transferSOL(await Wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(id), amount, desc);

        let msgToSender, msgToRecipient
        if( success ) {
          msgToSender    = `You sent ${amount} SOL to <@!${id}>` + ( desc ? `\n\nDescription:\n${desc}` : '')
          msgToRecipient = `You received ${amount} SOL from <@!${ message.author.id }>` + ( desc ? `\n\nDescription:\n${desc}` : '')
        } else {
          msgToSender    = `Could not send SOL to <@!${id}>\n\nError:\n${error}`
          msgToRecipient = `Failed to receive SOL from <@!${ message.author.id }>\n\nError:\n${error}`
        }
        // DM to sender
        await discord.send( message.author, { title: 'Tip SOL (Tx here)', description: msgToSender, url: solanaConnect.txLink(signature),});
        // DM to recipient
        let fetchedUser = await client.users.fetch(id, false);
        await discord.send( fetchedUser, { title: 'Tip SOL (Tx here)', description: msgToRecipient, url: solanaConnect.txLink(signature),});
      }
    }

    discord.react( message, SOL_Emoji, success );
    return;
  } else if ( command == "tipsail" || command == "ts" ) {
    if( message.channel.type == "DM" ) {
      return;
    } else {
      discord.deleteMessage( message, INTERVAL.long ) // TOUPDATE !
    }

    let validation = await Utils.validateForTipping(args, desc);
    if( !validation.status ) {
      await discord.error( message.channel, { description: validation.msg, });
      discord.react( message, undefined, undefined );
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(6);

    const { success, publicKey, sol, gSAIL, SAIL, } = await getBalances( message.author, message.channel);

    if( success ) {
      if ( sol.amount < SOL_FEE_LIMIT ) {
        await discord.error( message.channel, { description: `Not enough SOL fee to tip the SAIL`, });
        return;
      }

      if ( amount * recipientIds.length > SAIL.amount ) {
        await discord.error( message.channel, { description: `Not enough SAIL`, });
        return;
      }

      if( amount < TOKEN_TIP_LIMITS.$SAIL.min || TOKEN_TIP_LIMITS.$SAIL.max < amount ) { // Check tipping limits
        await discord.error( message.channel, { description: `Minimum amount: ${ TOKEN_TIP_LIMITS.$SAIL.min }\nMaximum amount: ${ TOKEN_TIP_LIMITS.$SAIL.max }`, });
        return;
      }

      for( const id of recipientIds ) {
        if( !await Wallet.getPublicKey(id) ) { // if the recipient doesn't have wallet
          await discord.error( message.channel, { description: `<@!${id}> doesn't have the wallet`, });
          continue;
        }

        // Update the balance of gSAIL
        // gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));
        // Update the balance of SAIL
        // SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));

        if( gSAIL.amount < TOKENS_REQUIRED.$gSAIL || SAIL.amount < TOKENS_REQUIRED.$SAIL ) { // Check for minimun required tokens
          await discord.error( message.channel, { description: `You should have at least ${ TOKENS_REQUIRED.$gSAIL } gSAIL and ${ TOKENS_REQUIRED.$SAIL } SAIL`, });
          return;
        }

        const { success, error, signature, } = await solanaConnect.transferSAIL(await Wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(id), amount, desc);

        let msgToSender, msgToRecipient
        if( success ) {
          msgToSender    = `You sent ${amount} SAIL to <@!${id}>` + ( desc ? `\n\nDescription:\n${desc}` : '')
          msgToRecipient = `You received ${amount} SAIL from <@!${ message.author.id }>` + ( desc ? `\n\nDescription:\n${desc}` : '')
        } else {
          msgToSender    = `Could not send SAIL to <@!${id}>\n\nError:\n${error}`
          msgToRecipient = `Failed to receive SAIL from <@!${ message.author.id }>\n\nError:\n${error}`
        }

        // DM to sender
        await discord.send( message.author, { title: 'Tip SAIL (Tx here)', description: msgToSender, url: solanaConnect.txLink(signature),});
        // DM to recipient
        let fetchedUser = await client.users.fetch(id, false);
        await discord.send( fetchedUser, { title: 'Tip SAIL (Tx here)', description: msgToRecipient, url: solanaConnect.txLink(signature),});
      }
    }

    discord.react( message, SAIL_Emoji, success );
    return;
  } else if( command == "tipgsail" || command == "tg" ) {
    if( message.channel.type == "DM" ) {
      return;
    } else {
      discord.deleteMessage( message, INTERVAL.long ) // TOUPDATE !
    }

    let validation = await Utils.validateForTipping(args, desc);
    if( !validation.status ) {
      await discord.error( message.channel, { description: validation.msg, });
      discord.react( message, undefined, undefined );
      return;
    }

    let recipientIds = validation.ids;
    let amount = validation.amount.toFixed(9);

    const { success, publicKey, sol, gSAIL, SAIL, } = await getBalances( message.author, message.channel);

    if( success ) {
      if ( sol.amount < SOL_FEE_LIMIT ) {
        await discord.error( message.channel, { description: `Not enough SOL fee to tip the gSAIL`, });
        return;
      }

      if( amount * recipientIds.length > gSAIL.amount) {
        await discord.error( message.channel, { description: `Not enough gSAIL`, });
        return;
      }

      if( amount < TOKEN_TIP_LIMITS.$gSAIL.min || TOKEN_TIP_LIMITS.$gSAIL.max < amount ) { // Check tipping limits
        await discord.error( message.channel, { description: `Minimum amount: ${ TOKEN_TIP_LIMITS.$gSAIL.min }\nMaximum amount: ${ TOKEN_TIP_LIMITS.$gSAIL.max }`, });
        return;
      }

      for( const id of recipientIds ) {
        if( !await Wallet.getPublicKey(id) ) { // if the recipient doesn't have the wallet
          await discord.error( message.channel, { description: `<@!${id}> doesn't have a wallet`, });
          continue;
        }

        // Update the balance of gSAIL
        // gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(message.author.id));
        // Update the balance of SAIL
        // SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(message.author.id));

        if( gSAIL.amount < TOKENS_REQUIRED.$gSAIL || SAIL.amount < TOKENS_REQUIRED.$SAIL) { // Check for minimun required tokens
          await discord.error( message.channel, { description: `You should have at least ${ TOKENS_REQUIRED.$gSAIL } gSAIL and ${ TOKENS_REQUIRED.$SAIL } SAIL`, });
          return;
        }

        const { success, error, signature, } = await solanaConnect.transferGSAIL(await Wallet.getPrivateKey(message.author.id), await Wallet.getPublicKey(id), amount, desc);

        let msgToSender, msgToRecipient
        if( success ) {
          msgToSender    = `You sent ${amount} gSAIL to <@!${id}>` + ( desc ? `\n\nDescription:\n${desc}` : '')
          msgToRecipient = `You received ${amount} gSAIL from <@!${ message.author.id }>` + ( desc ? `\n\nDescription:\n${desc}` : '')
        } else {
          msgToSender    = `Could not send gSAIL to <@!${id}>\n\nError:\n${error}`
          msgToRecipient = `Failed to receive gSAIL from <@!${ message.author.id }>\n\nError:\n${error}`
        }

        // DM to sender
        await discord.send( message.author, { title: 'Tip gSAIL (Tx here)', description: msgToSender, url: solanaConnect.txLink(signature),});
        // DM to recipient
        let fetchedUser = await client.users.fetch(id, false);
        await discord.send( fetchedUser, { title: 'Tip gSAIL (Tx here)', description: msgToRecipient, url: solanaConnect.txLink(signature),});
      }
    }

    discord.react( message, gSAIL_Emoji, success );
    return;
  } else if( command == "rainsail" || command == "raingsail" || command == "rs" || command == "rg" ) {
    if( message.channel.type == "DM" ) {
      return;
    } else {
      discord.deleteMessage( message, INTERVAL.long ) // TOUPDATE !
    }

    const label = ( command == 'rainsail' || command == 'rs' ) ? 'SAIL' : 'gSAIL';

    let validation = await Utils.validateForRaining(args);
    if( !validation.status ) {
      await discord.error( message.channel, { description: validation.msg, });
      return;
    }

    let amount = Number(validation.amount);
    let maxPeople = Number(validation.maxPeople);

    const { success, publicKey, sol, gSAIL, SAIL, } = await getBalances( message.author, message.channel);

    if( success ) {

      // if ( sol.amount < SOL_FEE_LIMIT ) {
      if ( sol.amount < maxPeople * SOL_FEE_LIMIT ) {        
        await discord.error( message.channel, { description: `Not enough SOL (fees) to make rain`, });
        return;
      }      

      // validate SAIL
      if( label == "SAIL" ) {
        if( amount > SAIL.amount ) {
          await discord.error( message.channel, { description: `Not enough ${label}`, });
          return;
        }

        if( amount < TOKEN_RAIN_LIMITS.$SAIL.min || TOKEN_RAIN_LIMITS.$SAIL.max  < amount ) { //Check raining limits
          await discord.error( message.channel, { description: `SAIL must be between ${ TOKEN_RAIN_LIMITS.$SAIL.min } and ${ TOKEN_RAIN_LIMITS.$SAIL.max }`, });
          return;
        }
      }

      // validate gSAIL
      if( label == "gSAIL" ) {
        if( amount > gSAIL.amount ) {
          await discord.error( message.channel, { description: `Not enough ${label}`, });
          return;
        }

        if( amount < TOKEN_RAIN_LIMITS.$gSAIL.min || TOKEN_RAIN_LIMITS.$gSAIL.max  < amount ) { //Check raining limits
          await discord.error( message.channel, { description: `gSAIL must be between ${ TOKEN_RAIN_LIMITS.$gSAIL.min } and ${ TOKEN_RAIN_LIMITS.$gSAIL.max }`, });
          return;
        }
      }

      // validate the max people
      if( maxPeople < 1 || TOKEN_RAIN_LIMITS.maxPeople <= maxPeople) {
        await discord.error( message.channel, { description: `Max people must be between 1 to ${ TOKEN_RAIN_LIMITS.maxPeople }`, });
        return;
      }

      const transfer = ( label == 'SAIL')  ? solanaConnect.transferSAIL  :
      ( label == 'gSAIL') ? solanaConnect.transferGSAIL :
      ( label == 'SOL')   ? solanaConnect.transferSOL   : null; // in case rainsol is ever added ;D

      const boardInfo = {
        collector: null,
        investor: message.author.id,
        limit: maxPeople,
        amount: 0,
        users: [],
        uiMain: null,
        uiLog: null,
      }

      boardInfo.uiMain = await discord.send( message.channel, {
        title: `**Rain ${label} from ${ message.author.username }**`,
        description: `Do you like it?\n\n**Prize:** ${amount} ${label} **People:** ${ boardInfo.users.length } / ${maxPeople}`,
      });
      await boardInfo.uiMain.react('✅');

      if( message.channel.id !=  LOG_CHANNEL_ID ) {
        boardInfo.uiLog = await discord.send( await guild.channels.cache.get(LOG_CHANNEL_ID), {
          author: { name: 'TipBot', url: boardInfo.uiMain.url },
          description: `**Rain ${label} from ${ message.author }**`,
          fields: [
            { name: `Prize`, value: `${amount} ${label}`, inline: true },
            { name: `People`, value: `${ boardInfo.users.length } / ${maxPeople}`, inline: true },
          ],
          timestamp: true,
        });
      } else {
        boardInfo.uiLog = boardInfo.uiMain
      }

      const filter = (reaction, user) => !user.bot && user.id != boardInfo.investor && ["✅"].includes(reaction.emoji.name);
      boardInfo.collector = boardInfo.uiMain.createReactionCollector({ filter });

      boardInfo.collector.on( 'collect', async (reaction, user) => {
        if (boardInfo.users.findIndex( u => u.id == user.id) != -1 || boardInfo.limit <= boardInfo.users.length) {
          return;
        }
        boardInfo.users.push(user); // Prevent the user from getting this rain again, We're assuming that transaction will succeed

        const from = await Wallet.getPrivateKey(boardInfo.investor),
              to = await Wallet.getPublicKey(user.id)
        console.assert( from, `investor's wallet not found` )

        let fetchedUser = await client.users.fetch(user.id, false);
        if( !to ) {
          await discord.error( message.channel, {
            title: `Rain ${label} Error`,
            description: `You need to use \`${COMMAND_PREFIX}register-wallet\` or \`${COMMAND_PREFIX}import-wallet\` first. Try \`${COMMAND_PREFIX}helptip\` if you need help`,
            autoHide: INTERVAL.short,
          } );
          removeItem( boardInfo.users, user ) // Transaction didn't occur, let's allow trying again after they register a wallet
          return;
        }

        let { success, error, signature, } = await transfer( from, to, amount / maxPeople, `Rain ${label}` )
        if( !success ) {
          console.log(`Error while raining ${label}!.\n${error}\nstack: ${error.stack}`)
          removeItem( boardInfo.users, user ) // Transaction failed, let's allow the user to try again

          await discord.error( fetchedUser, { title: `Rain ${label} Error`, description: String(error), });
          return;
        }

        const msg = `You received ${ amount / maxPeople } ${label} from <@!${ message.author.id }>`
        await discord.send( fetchedUser, { // DM to recipient
          title: `Rain ${label} (Tx here)`, description: msg, url: solanaConnect.txLink(signature),
        });

        let userList = ''
        for( const user of boardInfo.users ) {
          userList += user.username + '\n'
        }

        if( boardInfo.uiMain != boardInfo.uiLog ) {
          discord.edit( boardInfo.uiMain, {
            title: `**Rain ${label} from ${ message.author.username }**`,
            description: `**Prize:** ${amount} ${label} **People:** ${ boardInfo.users.length } / ${maxPeople}`,
          }).catch( error => {
            console.log(`Cannot send messages to this user.\n${error}\nstack: ${error.stack}`);
          })
        }

        discord.edit( boardInfo.uiLog, {
            // title: `Rain ${label}`,
            author: { name: 'TipBot', url: boardInfo.uiMain.url },
            description: `**Rain ${label} from ${ message.author }**`,
            fields: [
              { name: `Receivers`, value: userList.slice(-1024) }, // Removes the excess chars. Discord only allows max 1024 per field
              { name: `Prize`,     value: `${amount} ${label}`,                         inline: true },
              { name: `People`,    value: `${ boardInfo.users.length } / ${maxPeople}`, inline: true },
              { name: `Each`,      value: `${ amount / maxPeople } ${label}`,           inline: true },
            ],
            timestamp: true,
        } ).catch( error => {
          console.log(`Cannot send messages to this user.\n${error}\nstack: ${error.stack}`);
        } )
      })
    }
  }
});

async function getBalances( user, channel ) {
  let publicKey = null, sol = null, gSAIL = null, SAIL = null;

  try {

    if( !(await Wallet.getPrivateKey(user.id)) ) { // Wallet not created or registered, PK unnaccesible
      discord.error( channel, { title: `${ user.tag }`,
                      description: `You must register or import your wallet before using the bot\n\n**This must be done in a private DM channel!**`,
      } )
      return { success: false, };
    }

    publicKey = await Wallet.getPublicKey(user.id);

    // get the balance of sol
    sol = await solanaConnect.getSolBalance(publicKey);
    // get the balance of gSAIL
    gSAIL = await solanaConnect.getGSAILBalance(await Wallet.getPrivateKey(user.id));
    // get the balance of SAIL
    SAIL = await solanaConnect.getSAILBalance(await Wallet.getPrivateKey(user.id));

  } catch( error ) {
    console.log(`Error getting balances: \n${error}\nstack: ${error.stack}`);
    return { success: false, };
  }
  return { success: true, publicKey, sol, gSAIL, SAIL, }
}

try {
  // Login to Discord with your client's token
  client.login(DISCORD_TOKEN);
} catch( error ) {
  console.error(`Client has failed to connect to discord..\n${error}\nstack: ${error.stack}`);
  process.exit(6);
}

import Base58 from 'bs58'
import { COMMAND_PREFIX } from '../config/index.js'

const string2Uint8Array = async (str) => {
  var decodedString;
  try {
    decodedString = Base58.decode(str);
  } catch (error) {
    return [];
  }
  let arr = [];
  
  for(var i = 0; i < decodedString.length; i++){
    arr.push(decodedString[i]);
  };

  return arr;
}

const validateForTipping = async (args) => {
  // validate the default parameter. Default tip<type> @user <amount>
  if (args.length < 2) {
    return {
      status: false,
      msg: `Invalid format\n${COMMAND_PREFIX}tip<type> @user1 @user2 ... <amount> -m <description>`,
    };
  }

  let userIds = args.slice(0, args.length - 1);
  let amount = Number(args.slice(-1));

  let recipientIds = [];
  // validate the discord users
  for (let i = 0; i < userIds.length; i++) {
    // detect the discord user id
    const elem = (/<@!(\d+)>/).exec(userIds[i]) || (/<@(\d+)>/).exec(userIds[i]);
    
    if (!elem) {
      return {
        status: false,
        msg: `Invalid format\n${COMMAND_PREFIX}tip<type> @user1 @user2 ... <amount> -m <description>`,
      };
    }

    recipientIds.push(elem[1]);
  }

  // validate the number of users
  if (recipientIds.length >= 4) {
    return {
      status: false,
      msg: `Please input less than 4 users`,
    };
  }

  // validate the amount
  if (isNaN(amount) || amount <= 0) {
    return {
      status: false,
      msg: `Invalid Amount\n${COMMAND_PREFIX}tip<type> @user1 @user2 ... <amount> -m <description>`,
    };
  }
    
  return {
    status: true,
    ids: recipientIds,
    amount: amount,
    msg: ``,
  };
}

export default {
  string2Uint8Array,
  validateForTipping
}
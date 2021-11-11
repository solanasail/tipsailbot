import Base58 from 'bs58'
import { COMMAND_PREFIX, TIP_DESC_LIMIT, EXPECTED_ROLS } from '../config/index.js'

const string2Uint8Array = async (str) => {
  var decodedString;
  try {
    decodedString = Base58.decode(str);
  } catch (error) {
    return [];
  }
  let arr = [];

  for (var i = 0; i < decodedString.length; i++) {
    arr.push(decodedString[i]);
  };

  return arr;
}

const Uint8Array2String = async (arr) => {
  try {
    const buffer = Buffer.from(arr);
    return Base58.encode(buffer);
  } catch (error) {
    return '';
  }

}

const validateForTipping = async (args, desc) => {
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

  // validate the desc length
  if (desc.length > TIP_DESC_LIMIT) {
    return {
      status: false,
      msg: `Description limit ${TIP_DESC_LIMIT}`,
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

const validateForRaining = async (args) => {
  // validate the default parameter. Default rain<type> <amount> <max people>
  if (args.length < 2) {
    return {
      status: false,
      msg: `Invalid format\n${COMMAND_PREFIX}rain<type> <amount> <max people>`,
    };
  }

  const amount = args[0];
  const maxPeople = args[1];

  // validate the amount
  if (isNaN(amount) || amount <= 0) {
    return {
      status: false,
      msg: `Invalid Amount\n${COMMAND_PREFIX}rain<type> <amount> <max people>`,
    };
  }

  // validate the number of people
  if (isNaN(maxPeople) || maxPeople <= 0) {
    return {
      status: false,
      msg: `Invalid number of people\n${COMMAND_PREFIX}rain<type> <amount> <max people>`,
    };
  }

  return {
    status: true,
    amount: amount,
    maxPeople: Math.floor(maxPeople),
  };
}

const checkRoleInPublic = async (message) => {
  let role;

  let satisfiedCount = 0;
  for (let i = 0; i < EXPECTED_ROLS.length; i++) {
    const elem = EXPECTED_ROLS[i];

    role = message.guild.roles.cache.find(function (role) {
      return role.name == elem;
    });

    if (role && message.member.roles.cache.has(role.id)) {
      satisfiedCount++;
    }
  }

  if (satisfiedCount == EXPECTED_ROLS.length) {
    return true;
  }

  return false;
}

const checkRoleInPrivate = async (guild, message) => {
  if (!guild) {
    return false;
  }

  let role;
  let satisfiedCount = 0;
  for (let i = 0; i < EXPECTED_ROLS.length; i++) {
    const elem = EXPECTED_ROLS[i];

    role = guild.roles.cache.find(function (role) {
      return role.name == elem;
    });

    let member = await guild.members.fetch(message.author.id)

    if (role && member.roles.cache.has(role.id)) {
      satisfiedCount++;
    }
  }

  if (satisfiedCount == EXPECTED_ROLS.length) {
    return true;
  }

  return false;
}

export default {
  string2Uint8Array,
  Uint8Array2String,
  validateForTipping,
  validateForRaining,
  checkRoleInPublic,
  checkRoleInPrivate,
}
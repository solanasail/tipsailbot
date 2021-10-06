import Base58 from 'bs58'

const string2Uint8Array = async (str) => {
  var decodedString = Base58.decode(str);
  let arr = [];

  for(var i = 0; i < decodedString.length; i++){
    arr.push(decodedString[i]);
  };

  return arr;
}

const validateForTipping = async (args) => {
  // validate the default parameter. Default .tip<type> @user <amount>
  if (args.length < 2) {
    return {
      status: false,
      msg: `🚧 Invalid format 🚧\n🚧 .tip<type> @user1 @user2 ... <amount> 🚧`,
    };
  }

  let userIds = args.slice(0, args.length - 1);
  let amount = args.slice(-1);

  let recipientIds = [];
  // validate the discord users
  for (let i = 0; i < userIds.length; i++) {
    // detect the discord user id
    const elem = (/(\d+)/).exec(userIds[i]);

    if (!elem || elem.index != 3) {
      return {
        status: false,
        msg: `🚧 Invalid User 🚧\n🚧 .tip<type> @user1 @user2 ... <amount> 🚧`,
      };
    }

    recipientIds.push(elem[1]);
  }

  // validate the amount
  if (isNaN(parseFloat(amount)) || amount <= 0) {
    return {
      status: false,
      msg: `🚧 Invalid Amount 🚧\n🚧 .tip<type> @user1 @user2 ... <amount> 🚧`,
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
const COMMANDS = {
  CREATE_NEW: 'create-new',
  LOGIN: 'login',
  ME: 'me',
  CLUSTER: 'cluster',
  SEND: 'send',
  LOGOUT: 'logout',
  SAVE_DISCORDKEY: 'save-discordkey',
  DELETE_DISCORDKEY: 'delete-discordkey',
  GET_DISCORDKEY: 'get-discordkey',
  HELP: 'help',
};

const OK_WITHOUT_LOGIN_COMMANDS = [
  COMMANDS.CREATE_NEW,
  COMMANDS.LOGIN,
  COMMANDS.SAVE_DISCORDKEY,
  COMMANDS.DELETE_DISCORDKEY,
  COMMANDS.GET_DISCORDKEY,
  COMMANDS.HELP,
];

export default {
  creationCommands: [COMMANDS.CREATE_NEW, COMMANDS.LOGIN],
  OK_WITHOUT_LOGIN_COMMANDS,
  getAllCommands: () => allCommands,
  COMMANDS,
};
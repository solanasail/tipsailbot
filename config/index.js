const CLUSTERS = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
  TESTNET: 'testnet',
};

export const ACTIVE_CLUSTER=CLUSTERS.DEVNET;

export const COMMAND_PREFIX='?';

export const DISCORD_TOKEN='ODkyMTI0Mzk1MDg5Mjk3NDg4.YVIVlg.KPLE9Naq2JUpaQIerSw9yXoeohY'

export const gSAIL_TOKEN_ADDRESS='so2UmtgXmc1mMk7GKNtPfCNeWuDjEMUa5JsEGYg8x7t'
export const SAIL_TOKEN_ADDRESS='4WkdBnsUt3zyWkhVbXgY9aQeR64ri42ioYTuaZp8WATn'

export const SOL_FEE_LIMIT=0.001

export const DEFAULT_GSAIL_AMOUNT=1
export const DEFAULT_SAIL_AMOUNT=1

export const SOL_Emoji='sol'
export const SAIL_Emoji='sail'
export const gSAIL_Emoji='gsail'

export const TRANSACTION_DESC='.........description.........'
export const TIP_DESC_LIMIT=50

export const DB_HOST='localhost'
export const DB_PORT='27017'
export const DB_USERNAME=''
export const DB_PASSWORD=''
export const DB_NAME='tip_sail'

export const GUILD_ID='847485334157656107'
export const LOG_CHANNEL_ID='847485334157656113'

export const TRANSACTION_EXPLORERS = {
  SOLSCAN:  'https://solscan.io/tx/%s',
  SOLANA:   'https://explorer.solana.com/tx/%s' + ACTIVE_CLUSTER !== CLUSTERS.MAINNET ? `?cluster=${ACTIVE_CLUSTER}` : '',
};

export const EXPECTED_ROLES=[
  'SAILOR',
  '@everyone'
]
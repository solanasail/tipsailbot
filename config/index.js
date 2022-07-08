const CLUSTERS = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
  TESTNET: 'testnet',
};

// DB Settings
export const DB_HOST='localhost'
export const DB_PORT='27017'
export const DB_USERNAME=''
export const DB_PASSWORD=''
export const DB_NAME='tip_sail'

// Discord Settings
export const COMMAND_PREFIX='?';

export const DISCORD_TOKEN='DISCORD_TOKEN'

export const GUILD_ID='GUILD_ID'
export const LOG_CHANNEL_ID='LOG_CHANNEL_ID'

export const EXPECTED_ROLES=[
  'SAILOR',
  '@everyone'
]

export const HELP_MSG = 'HELP_MSG_LINK'
export const dangerColor = '#d93f71';
export const infoColor = '#0099ff';

// Tokens and BC Settings
export const ACTIVE_CLUSTER=CLUSTERS.DEVNET;

const INTERNAL_TOKEN_LIST = [
  {
    'chainId': 101,
    'address': {
      'mainnet-beta': 'So11111111111111111111111111111111111111112',
      'devnet': 'So11111111111111111111111111111111111111112',
      'testnet': 'So11111111111111111111111111111111111111112',
    },
    'symbol': 'SOL',
    'name': 'Wrapped SOL',
    'decimals': 9,
    'logoURI': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    'extensions': {
      'coingeckoId': 'solana',
      'website': 'https://solana.com/'
    }
  },
  {
    'chainId': 101,
    'address': {
      'mainnet-beta': '6kwTqmdQkJd8qRr9RjSnUX9XJ24RmJRSrU1rsragP97Y',
      'devnet': '4WkdBnsUt3zyWkhVbXgY9aQeR64ri42ioYTuaZp8WATn',
      'testnet': '4WkdBnsUt3zyWkhVbXgY9aQeR64ri42ioYTuaZp8WATn',
    },
    'symbol': 'SAIL',
    'name': 'SAIL',
    'decimals': 6,
    'logoURI': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/6kwTqmdQkJd8qRr9RjSnUX9XJ24RmJRSrU1rsragP97Y/logo.png',
    'extensions': {
      'coingeckoId': 'sail',
      'twitter': 'https://twitter.com/SolanaSail',
      'website': 'https://www.solanasail.com'
    }
  },
  {
    'chainId': 101,
    'address': {
      'mainnet-beta': 'Gsai2KN28MTGcSZ1gKYFswUpFpS7EM9mvdR9c8f6iVXJ',
      'devnet': 'so2UmtgXmc1mMk7GKNtPfCNeWuDjEMUa5JsEGYg8x7t',
      'testnet': 'so2UmtgXmc1mMk7GKNtPfCNeWuDjEMUa5JsEGYg8x7t',
    },
    'symbol': 'gSAIL',
    'name': 'SolanaSail Governance Token V2',
    'decimals': 9,
    'logoURI': 'https://raw.githubusercontent.com/solanasail/token-list/main/assets/mainnet/Gsai2KN28MTGcSZ1gKYFswUpFpS7EM9mvdR9c8f6iVXJ/logo.png',
    'extensions': {
      'coingeckoId': 'solanasail-governance-token',
      'twitter': 'https://twitter.com/SolanaSail',
      'website': 'https://www.solanasail.com'
    }
  },
]

function _hashedTokens(list) {
  let result = Array.from(list)
  for( const item of list ) {
    // console.assert( item?.symbol )
    // console.assert( item?.name )
    // console.assert( item?.address['mainnet-beta'] )
    result['$'+item.symbol] = item
  }
  return result;
}

export const TOKEN_LIST = _hashedTokens(INTERNAL_TOKEN_LIST)

export const TOKENS_REQUIRED =
{ $SAIL :  1,
  $gSAIL : 1,
}

export const TOKEN_TIP_LIMITS = {
  default: { min: 0.1,     max: 1_000_000, },
  $SAIL :  { min: 0.1,     max: 1000, },
  $gSAIL : { min: 0.1,     max: 200, },
  $SOL :   { min: 0.00001, max: 5, },
}

export const TOKEN_RAIN_LIMITS = {
  maxPeople: 40,

  default: { min: 0.1,   max: 1_000_000, },
  $SAIL :  { min: 1,     max: 1000, },
  $gSAIL : { min: 1,     max: 100, },
  $SOL :   { min: 0.001, max: 5, },
}

// TODO: REMOVE
export const SOL_FEE_LIMIT=0.001
//

export const TRANSACTION_EXPLORERS = {
  SOLSCAN:  'https://solscan.io/tx/%s' + (( ACTIVE_CLUSTER !== CLUSTERS.MAINNET ) ? `?cluster=${ACTIVE_CLUSTER}` : ''),
  SOLANA:   'https://explorer.solana.com/tx/%s' + (( ACTIVE_CLUSTER !== CLUSTERS.MAINNET ) ? `?cluster=${ACTIVE_CLUSTER}` : ''),
};

export const SOL_Emoji='sol'
export const SAIL_Emoji='sail'
export const gSAIL_Emoji='gsail'
export const Error_Emoji='error'

export const TRANSACTION_DESC=''
export const TIP_DESC_LIMIT=50


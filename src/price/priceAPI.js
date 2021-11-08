import fetch from 'node-fetch';

const getSolPriceInUSD = async () => {
  const json = await fetch('https://api.coingecko.com/api/v3/coins/solana')
    .then((res) => res.json());
  return json.market_data.current_price.usd;
};

const getGSailPriceInUSD = async () => {
  const json = await fetch('https://api.coingecko.com/api/v3/coins/solanasail-governance-token')
    .then((res) => res.json());
  return json.market_data.current_price.usd;
};

const getSailPriceInUSD = async () => {
  const json = await fetch('https://api.coingecko.com/api/v3/coins/sail')
    .then((res) => res.json());
  return json.market_data.current_price.usd;
};

export default {
  getSolPriceInUSD,
  getGSailPriceInUSD,
  getSailPriceInUSD,
};

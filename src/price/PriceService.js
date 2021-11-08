import PriceAPI from './priceAPI.js';

const getDollarValueForSol = async (sol) => {
  try {
    const currentPrice = await PriceAPI.getSolPriceInUSD();
    return (sol * currentPrice).toFixed(2);
  } catch (error) {
    return 0;
  }
};

const getDollarValueForGSail = async (gsail) => {
  try {
    const currentPrice = await PriceAPI.getGSailPriceInUSD();
    return (gsail * currentPrice).toFixed(2);
  } catch (error) {
    return 0;
  }
}

const getDollarValueForSail = async (sail) => {
  try {
    const currentPrice = await PriceAPI.getSailPriceInUSD();
    return (sail * currentPrice).toFixed(2);
  } catch (error) {
    return 0;
  }
}

export default {
  getDollarValueForSol,
  getDollarValueForGSail,
  getDollarValueForSail
};

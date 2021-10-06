import PriceAPI from './priceAPI.js';

const convertLamportsToSol = (lamports) => (lamports * 0.000000001).toFixed(4);

const getDollarValueForSol = async (sol) => {
  try {
    const currentPrice = await PriceAPI.getSolPriceInUSD();
    return (sol * currentPrice).toFixed(2);
  } catch (error) {
    return 0;
  }  
};

export default {
  convertLamportsToSol,
  getSolPriceInUSD: PriceAPI.getSolPriceInUSD,
  getDollarValueForSol,
};

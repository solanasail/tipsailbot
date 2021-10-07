import SessionStorageService from './SessionStorageService.js';

const getPublicKey = async (id) => {
  return await SessionStorageService.getPublicKey(id);
}  

const getPrivateKey = async (id) => {
  return await SessionStorageService.getPrivateKey(id);
}

export default {
  getPublicKey,
  getPrivateKey
}
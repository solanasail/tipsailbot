import SessionStorageService from './SessionStorageService.js';

const login = async (id, privateKey, publicKey, cluster) => {
  await Promise.all([
    SessionStorageService.setKeyPair(id, privateKey, publicKey),
    SessionStorageService.setCluster(id, cluster),
  ]);
};

const isLoggedIn = async (id) => {
  return await SessionStorageService.getPublicKey(id);
};

const getPrivateKey = async (id) => {
  return await SessionStorageService.getPrivateKey(id);
}

export default {
  login,
  isLoggedIn,
  getPrivateKey
}
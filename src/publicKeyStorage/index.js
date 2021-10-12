import mongoose from 'mongoose'
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } from '../../config/index.js'
import userModel from './models/user.js';
import SessionStorageService from '../wallet/SessionStorageService.js';

const connectDB = async (cluster) => {
  mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}`, {
    dbName: DB_NAME,
    user: DB_USERNAME,
    pass: DB_PASSWORD
  });

  let users = await userModel.find({});

  // load the users.
  for (let i = 0; i < users.length; i++) {
    const elem = users[i];

    await Promise.all([
      SessionStorageService.setPublicKey(elem.discordId, elem.publicKey),
      SessionStorageService.setCluster(elem.discordId, cluster),
    ]);
  }
}

const saveUser = async (obj) => {
  await userModel.updateOne({
    discordId: obj.discordId,
  }, { publicKey: obj.publicKey }, { upsert: true });
};

const getUser = (discordId) => {
};

const deleteUser = async (discordId) => {
};

export default {
  connectDB,
  saveUser,
  getUser,
  deleteUser,
}

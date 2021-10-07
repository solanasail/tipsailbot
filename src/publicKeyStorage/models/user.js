import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const UserSchema= new Schema({ 
  discordId: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', UserSchema);

export default User
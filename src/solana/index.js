import web3 from '@solana/web3.js'
import splToken from '@solana/spl-token'
import { gSAIL_TOKEN_ADDRESS, SAIL_TOKEN_ADDRESS } from '../../config/index.js'

const createWallet = async (cluster) => { 
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');
  var wallet = web3.Keypair.generate();
  
  return {
    privateKey: wallet.secretKey,
    publicKey: wallet.publicKey.toString(),
  };
};

const importWallet = async (cluster, keyArr) => { 
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');
  try {
    var wallet = web3.Keypair.fromSecretKey(new Uint8Array(keyArr));
  } catch (error) {
    return {
      status: false,
    };
  }
  
  return {
    status: true,
    privateKey: wallet.secretKey,
    publicKey: wallet.publicKey.toString(),
  };
};

const getSolBalance = async (publicKey, cluster) => {
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');

  try {
    let amount = await connection.getBalance(new web3.PublicKey(publicKey)) / web3.LAMPORTS_PER_SOL;

    return {
      status: true,
      amount: amount, 
    };
  } catch (error) {
    return {
      status: false,
      amount: 0
    };
  }
};

const getGSAILBalance = async (privateKey, cluster) => {
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');
  var wallet = web3.Keypair.fromSecretKey(new Uint8Array(Object.values(privateKey)));

  let token = await new splToken.Token(
    connection, 
    new web3.PublicKey(gSAIL_TOKEN_ADDRESS), 
    splToken.TOKEN_PROGRAM_ID,
    wallet
  );
  
  let account;

  try {
    // get the token account of this solana address, if it does not exist, create it
    account = await token.getOrCreateAssociatedAccountInfo(
      wallet.publicKey
    )
  } catch (error) {
    return {
      isExistToken: false,
      amount: 0
    }; 
  }

  return {
    isExistToken: true,
    amount: account.amount / 1000000000
  };
}

const getSAILBalance = async (privateKey, cluster) => {
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');
  var wallet = web3.Keypair.fromSecretKey(new Uint8Array(Object.values(privateKey)));

  let token = await new splToken.Token(
    connection, 
    new web3.PublicKey(SAIL_TOKEN_ADDRESS), 
    splToken.TOKEN_PROGRAM_ID,
    wallet
  );

  let account;

  try {
    // get the token account of this solana address, if it does not exist, create it
    account = await token.getOrCreateAssociatedAccountInfo(
      wallet.publicKey
    )
  } catch (error) {
    return {
      isExistToken: false,
      amount: 0
    };
  }

  return {
    isExistToken: true,
    amount: account.amount / 1000000000
  };
}

const transferSOL = async (cluster, fromPrivateKey, toPubKey, sol) => {
  var fromWallet = web3.Keypair.fromSecretKey(new Uint8Array(Object.values(fromPrivateKey)));

  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');

  // Add transfer instruction to transaction
  let transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toPubKey,
      lamports: sol * web3.LAMPORTS_PER_SOL,
    }),
  );

  // Sign transaction, broadcast, and confirm
  web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
  ); 
};

const transferSAIL = async (cluster, fromPrivateKey, toPubKey, amount) => {
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');

  var fromWallet = web3.Keypair.fromSecretKey(new Uint8Array(Object.values(fromPrivateKey)));

  let token = await new splToken.Token(
    connection, 
    new web3.PublicKey(SAIL_TOKEN_ADDRESS),
    splToken.TOKEN_PROGRAM_ID,
    fromWallet
  );

  let fromTokenAccount;
  try {
    // get the token account of this solana address, if it does not exist, create it
    fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
      fromWallet.publicKey
    )
  } catch (error) {
    return false;
  }

  let toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
    new web3.PublicKey(toPubKey),
  );

  var transaction = new web3.Transaction().add(
    splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      [],
      amount * 1000000000, // This is transferring 1 token, not 1000000 tokens
    ),
  );
      
  await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
    {commitment: 'confirmed'},
  );
}

const transferGSAIL = async (cluster, fromPrivateKey, toPubKey, amount) => {
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');

  var fromWallet = web3.Keypair.fromSecretKey(new Uint8Array(Object.values(fromPrivateKey)));

  let token = await new splToken.Token(
    connection, 
    new web3.PublicKey(gSAIL_TOKEN_ADDRESS),
    splToken.TOKEN_PROGRAM_ID,
    fromWallet
  );

  let fromTokenAccount;
  try {
    // get the token account of this solana address, if it does not exist, create it
    fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
      fromWallet.publicKey
    )
  } catch (error) {
    return false;
  }

  let toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
    new web3.PublicKey(toPubKey),
  );

  var transaction = new web3.Transaction().add(
    splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      [],
      amount * 1000000000, // This is transferring 1 token, not 1000000 tokens
    ),
  );
      
  await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
    {commitment: 'confirmed'},
  );
}

export default {
  createWallet,
  importWallet,
  getSolBalance,
  getGSAILBalance,
  getSAILBalance,
  transferSOL,
  transferSAIL,
  transferGSAIL
};
import * as web3 from '@solana/web3.js';

const createWallet = async (cluster) => { 
  // const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');
  var wallet = web3.Keypair.generate();

  // // airdrop SOL
  // var fromAirdropSignature = await connection.requestAirdrop(
  //   wallet.publicKey,
  //   web3.LAMPORTS_PER_SOL,
  // );

  // // wait for airdrop confirmation
  // await connection.confirmTransaction(fromAirdropSignature);

  return {
    privateKey: wallet.secretKey,
    publicKey: wallet.publicKey.toString(),
  };
};

const getBalance = async (publicKey, cluster) => {
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed');
  return await connection.getBalance(new web3.PublicKey(publicKey)) / web3.LAMPORTS_PER_SOL;
};

const transfer = async (cluster, fromPrivateKey, toPubKey, sol) => {
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

export default {
  createWallet,
  getBalance,
  transfer
};
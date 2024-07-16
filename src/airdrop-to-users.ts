import fs from 'fs';
import { getKeypairFromFile } from '@solana-developers/helpers';
import { getOrCreateAssociatedTokenAccount } from 'solana-spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
(async () => {
  const totalAmount: Record<string, number> = {};
  const reportData = JSON.parse(fs.readFileSync('./data/report.json', 'utf8'));
  console.log(reportData);
  for (const user in reportData) {
    for (const mint in reportData[user]) {
      const { amount, kycLevel, txHashs } = reportData[user][mint];
      if (totalAmount[mint]) {
        totalAmount[mint] += amount;
      } else {
        totalAmount[mint] = amount;
      }
    }
  }

  console.log(totalAmount);
  const connection = new Connection('https://api-mainnet-beta.renec.foundation:8899/');
  const keypair = await getKeypairFromFile('~/.config/renec/deployer_mainnet.json');
  for (const token in totalAmount) {
    console.log(`TOKEN ${token}`);
    // const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, keypair, new PublicKey(token), keypair.publicKey);
    // console.log(tokenAccount.amount);
  }
})();

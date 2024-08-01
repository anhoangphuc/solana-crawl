import fs from 'fs';
import { getKeypairFromFile } from '@solana-developers/helpers';
import { getOrCreateAssociatedTokenAccount, getAccount, transfer, getAssociatedTokenAddress } from 'solana-spl-token';
import { Connection, PUBLIC_KEY_LENGTH, PublicKey } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';
(async () => {
  const totalAmount: Record<string, number> = {};
  const reportData = JSON.parse(fs.readFileSync('./data/report.json', 'utf8'));
  console.log(reportData);
  for (const user in reportData) {
    for (const mint in reportData[user]) {
      const { amount, symbol, kycLevel, txHashs } = reportData[user][mint];
      if (totalAmount[symbol]) {
        totalAmount[symbol] += amount;
      } else {
        totalAmount[symbol] = amount;
      }
    }
  }

  console.log("TOTAL AMOUNT");
  console.log(totalAmount);
  const connection = new Connection('https://api-mainnet-beta.renec.foundation:8899/');
  const keypair = await getKeypairFromFile('~/.config/renec/deployer_mainnet.json');


  // const getBalance: Record<string, boolean> = {};
  // for (const user in reportData) {
  //   for (const mint in reportData[user]) {
  //     if (getBalance[mint] === true)
  //       continue;
  //     getBalance[mint] = true;
  //     console.log("MINT ", mint);
  //     const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, keypair, new PublicKey(mint), keypair.publicKey);
  //     console.log("BALANCE ", tokenAccount.amount);
  //   }
  // }

  for (const user in reportData) {
    for (const mint in reportData[user]) {
      const { amount, symbol, kycLevel, txHashs } = reportData[user][mint];
      if (!["reUSD", "RENEC", "reVND"].includes(symbol)) {
        continue;
      }
      console.log("USER", user, "MINT", mint, "AMOUNT", amount, symbol, "KYC LEVEL ", kycLevel);
      if (symbol === "RENEC") {
        const transaction = new web3.Transaction().add(
          web3.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(user),
            lamports: amount,
          })
        );
        const txHash  = await web3.sendAndConfirmTransaction(connection, transaction, [keypair]);
        console.log("Transfer success at txHash ", txHash);
      } else {
        const source = await getAssociatedTokenAddress(new PublicKey(mint), keypair.publicKey);
        const destination = await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(user));
        const txHash = await transfer(connection, keypair, source, destination, keypair, amount);
        console.log("Transfer success at txHash", txHash);
      }
      await delay(3000);
    }
  }
})();

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


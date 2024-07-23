import fs from 'fs';
import { getKeypairFromFile } from '@solana-developers/helpers';
import { getOrCreateAssociatedTokenAccount, getAccount } from 'solana-spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
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

  for (const user in reportData) {
    for (const mint in reportData[user]) {
      const { amount, symbol, kycLevel, txHashs } = reportData[user][mint];
      console.log("USER", user, "MINT", mint, "AMOUNT", amount, "SYMBOL", symbol);
    }
  }
})();

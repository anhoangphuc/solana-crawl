// This section of the code is responsible for fetching and processing token accounts for a given mint address.
// It iterates through the list of token accounts, logging the number of accounts fetched and the total amount of tokens.
// The fetched accounts are stored in the listTokenAccount array, which is later written to a JSON file for further analysis.
// The process stops when there are no more accounts to fetch, indicating the end of the pagination.

import { writeFileSync } from 'fs';
import { Helius, DAS } from 'helius-sdk';
import dotenv from 'dotenv';

dotenv.config();

const helius = new Helius(process.env.HELIUS_API_KEY || '');

async function fetchTokenAccount(mintAddress: string) {
  if (!mintAddress) {
    console.error('Please provide the mint address as an argument.');
    process.exit(1);
  }
  let cursor = undefined;
  let totalTokenAccount = 0;
  const listTokenAccount = [];
  while (true) {
    const result = await helius.rpc.getTokenAccounts({
      mint: mintAddress,
      cursor
    });
    if (result?.token_accounts) {
      listTokenAccount.push(...result.token_accounts);
    }
    console.log(`FETCH ${result.total} TOKEN ACCOUNT`);
    totalTokenAccount += result.total || 0;
    cursor = result.cursor;
    if (result.total === 0) {
      break;
    }
  }
  writeFileSync('listTokenAccount.json', JSON.stringify(listTokenAccount, null, 2));
}

async function getTopBalanceWithMinimumAmount(topK: number, minimumAmount: number) {
  const fs = require('fs');
  const path = require('path');

  const filePath = path.join('./', 'listTokenAccount.json');
  const data = fs.readFileSync(filePath, 'utf8');
  const accounts = JSON.parse(data) as DAS.TokenAccounts[];

  const sortedAccounts = accounts
    .filter(account => account.amount && account.amount >= minimumAmount)
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, topK);

  const topAccountsFilePath = path.join('./', 'topTokenAccounts.json');
  fs.writeFileSync(topAccountsFilePath, JSON.stringify(sortedAccounts, null, 2));
  console.log(`Top ${topK} accounts with minimum amount ${minimumAmount} written to ${topAccountsFilePath}`);
}

(async () => {
  if (process.argv[2] === 'fetch') {
    const mintAddress = process.argv[3];
    await fetchTokenAccount(mintAddress);
  } else if (process.argv[2] === 'top') {
    const topK = parseInt(process.argv[3], 10);
    const minimumAmount = parseInt(process.argv[4], 10);
    if (!isNaN(topK) && !isNaN(minimumAmount)) {
      await getTopBalanceWithMinimumAmount(topK, minimumAmount);
    } else {
      console.error('Please provide valid numbers for topK and minimumAmount.');
      process.exit(1);
    }
  } else {
    console.error('Invalid command. Please use "fetch" or "top".');
    process.exit(1);
  }
})()

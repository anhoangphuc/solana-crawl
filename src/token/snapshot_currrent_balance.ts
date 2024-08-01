// This section of the code is responsible for fetching and processing token accounts for a given mint address.
// It iterates through the list of token accounts, logging the number of accounts fetched and the total amount of tokens.
// The fetched accounts are stored in the listTokenAccount array, which is later written to a JSON file for further analysis.
// The process stops when there are no more accounts to fetch, indicating the end of the pagination.

import { writeFileSync } from 'fs';
import { Helius } from 'helius-sdk';
import dotenv from 'dotenv';

dotenv.config();

const helius = new Helius(process.env.HELIUS_API_KEY || '');
(async () => {
  const mintAddress = process.argv[2];
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
})();

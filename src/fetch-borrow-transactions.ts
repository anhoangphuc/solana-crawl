import { PublicKey, Connection, ParsedTransactionWithMeta, Keypair } from '@solana/web3.js';
import { fetchTransactionsFromProgramId } from './services/fetcher';
import { convertDateStringToUnixTimeSecond } from './utils';
import { Context, KYC_PROGRAM_ID_MAINNET, ProviderClient } from '@renec-foundation/kyc-sdk';
import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { TokenAccountNotFoundError, getAccount } from 'solana-spl-token';
import fs from 'fs';

const connectionURI = 'https://api-mainnet-beta.renec.foundation:8899/';
// const connectionURI = "https://api-testnet.renec.foundation:8899/";
const programId = '48qby9KswHa1dWa6xYKSYPju3oidfG6aZqDn8jSfpbcR';

export const customFilter = (parsedTransaction: ParsedTransactionWithMeta) => {
  if (parsedTransaction.meta?.logMessages) {
    return parsedTransaction.meta?.logMessages?.some((x) => x.includes('borrow_fee_receiver'));
  }
  return false;
};

export async function extractBorrowDetails(connection: Connection, parsedTransaction: ParsedTransactionWithMeta) {
  const borrowDetails = parsedTransaction.meta?.logMessages?.find((x) => x.includes('borrow_fee_receiver'));
  if (borrowDetails) {
    const [borrowFeePart, borrowerPart] = borrowDetails.split(',');
    const amountMatch = borrowFeePart.match(/\b\d+\b/);
    const amount = amountMatch ? amountMatch[0] : null;
    const borrowerMatch = borrowerPart.match(/[A-Za-z0-9]{32,44}/);
    const borrower = borrowerMatch ? borrowerMatch[0] : null;
    if (amount === null || borrower === null) {
      throw new Error(`Parsed tx error ${parsedTransaction.transaction.signatures}`);
    }
    const tokenAccount = await getAccount(connection, new PublicKey(borrower));
    const user = parsedTransaction.transaction.message.accountKeys.filter((account) => account.signer).at(-1)?.pubkey;
    return {
      txHash: parsedTransaction.transaction.signatures[0],
      user: user?.toBase58(),
      amount,
      mint: tokenAccount.mint.toBase58(),
      blockTimestamp: parsedTransaction.blockTime
    };
  } else {
    throw new Error(`Parsed tx error ${parsedTransaction.transaction.signatures}`);
  }
}
(async () => {
  const startTime = convertDateStringToUnixTimeSecond('15/07/2024 00:00:00');
  const endTime = convertDateStringToUnixTimeSecond('17/07/2024 00:00:00');
  const txs = await fetchTransactionsFromProgramId(
    programId,
    connectionURI,
    { pageSize: 50, startTime, endTime },
    customFilter
  );
  const connection = new Connection(connectionURI, 'confirmed');
  const borrowUsers = await Promise.all(
    txs.map(async (tx) => {
      if (tx) {
        const res = await extractBorrowDetails(connection, tx);
        return res;
      }
    })
  );

  fs.writeFileSync('./data/user_borrow.json', JSON.stringify(borrowUsers, null, 2));
})();

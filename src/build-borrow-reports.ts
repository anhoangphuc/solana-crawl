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
      blockTimestamp: parsedTransaction.blockTime,
    };
  }
}
type BorrowDetatil = {
    txHash: string;
    user: string;
    amount: number;
    mint: string;
    blockTimestamp: number;
}
(async () => {
  const borrowsData = fs.readFileSync('./data/user_borrow.json', 'utf8');
  const borrowUsers: BorrowDetatil[] = JSON.parse(borrowsData);

  const newWallet = Keypair.generate();
  const connection = new Connection(connectionURI, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(newWallet), { commitment: 'confirmed' });
  const ctx = Context.withProvider(provider, new PublicKey(KYC_PROGRAM_ID_MAINNET));

  const nameHashRound = 10000;
  const documentIdHashRound = 1000000;
  const phoneHashRound = 1000000;
  const dobHashRound = 10000;
  const doeHashRound = 10000;
  const genderHashRound = 1000;

  const providerClient = await ProviderClient.getClient(
    ctx,
    nameHashRound,
    documentIdHashRound,
    phoneHashRound,
    dobHashRound,
    doeHashRound,
    genderHashRound
  );

  const report: Record<string, Record<string, any>> = {};
  const kycLevel: Record<string, number> = {};

  for (const user of borrowUsers) {
    if (!kycLevel[user.user]) {
      try {
        const userConfigData = await providerClient.getUserConfig(new PublicKey(user.user));
        kycLevel[user.user] = userConfigData?.kycLevel || 0;
      } catch (error) {
        kycLevel[user.user] = 0;
      }
    }
    if (!report[user.user]) {
      report[user.user] = {};
    }
    if (!report[user.user][user.mint]) {
      report[user.user][user.mint] = {
        amount: Number(user.amount),
        kycLevel: kycLevel[user.user],
        txHashs: [user.txHash],
      }
    } else {
      report[user.user][user.mint].amount += Number(user.amount);
      report[user.user][user.mint].txHashs.push(user.txHash);
    }
  }
  fs.writeFileSync('./data/report.json', JSON.stringify(report, null, 2));
  const csvHeaders = ['user', 'mint', 'amount', 'kycLevel', 'txHashs'];
  const csvRows = [csvHeaders.join(',')];

  for (const user in report) {
    for (const mint in report[user]) {
      const { amount, kycLevel, txHashs } = report[user][mint];
      const row = [user, mint, amount, kycLevel, txHashs.join(';')];
      csvRows.push(row.join(','));
    }
  }

  fs.writeFileSync('./data/report.csv', csvRows.join('\n'));
})();

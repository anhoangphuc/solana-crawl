import { PublicKey, Connection, ParsedTransactionWithMeta, Keypair } from '@solana/web3.js';
import { fetchTransactionsFromProgramId } from './services/fetcher';
import { convertDateStringToUnixTimeSecond } from './utils';
import { Context, KYC_PROGRAM_ID_MAINNET, ProviderClient } from '@renec-foundation/kyc-sdk';
import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { TokenAccountNotFoundError, getAccount } from 'solana-spl-token';

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
      mint: tokenAccount.mint.toBase58()
    };
  }
}
(async () => {
  const startTime = convertDateStringToUnixTimeSecond('08/07/2024 00:00:00');
  const endTime = convertDateStringToUnixTimeSecond('09/07/2024 00:00:00');
  const txs = await fetchTransactionsFromProgramId(
    programId,
    connectionURI,
    { pageSize: 50, startTime, endTime },
    customFilter
  );
  const connection = new Connection(connectionURI, 'confirmed');
  await Promise.all(
    txs.map(async (tx) => {
      if (tx) {
        const res = await extractBorrowDetails(connection, tx);
        console.log(res);
      }
    })
  );

  console.log('KYC DATA ');
  const newWallet = Keypair.generate();
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

  const userConfigData = await providerClient.getUserConfig(
    new PublicKey('9511zo4QUm35beZtziujSScrS7tcaqvBAB3HHG6zD1AK')
  );
  console.log(userConfigData);
})();

import { Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { FetchTransactionsParam } from './types';

export async function fetchTransactionsFromProgramId(
  programId: string,
  connectionUrl: string,
  fetchTransactionsParam: FetchTransactionsParam,
  customFilter?: (parsedTransaction: ParsedTransactionWithMeta) => boolean,
  customProcessor?: (parsedTransaction: ParsedTransactionWithMeta) => void,
): Promise<{ parsedTransactions: (ParsedTransactionWithMeta | null)[]; processedTransactions: any[] }> 
 {
  const connection = new Connection(connectionUrl, 'confirmed');
  const programPublicKey = new PublicKey(programId);

  const transactions = [];
  let beforeTransactionSignature = undefined;
  let remainTransactionsCount = fetchTransactionsParam.count ?? Number.MAX_SAFE_INTEGER;
  let pageSize = fetchTransactionsParam.pageSize || 10;
  while (true) {
    const transactionSignatures = await connection.getSignaturesForAddress(programPublicKey, {
      limit: Math.min(pageSize, remainTransactionsCount),
      before: beforeTransactionSignature
    });
    console.log('GET TRANSACTION SIGNATURES SUCCESS', transactionSignatures.length);

    remainTransactionsCount -= transactionSignatures.length;

    const parsedTransactions = await connection.getParsedTransactions(
      transactionSignatures.map((signatureInfo) => signatureInfo.signature),
      { commitment: 'confirmed', maxSupportedTransactionVersion: 0 },
    );

    const filteredTransactions = parsedTransactions
      .filter((parsedTransaction) => parsedTransaction !== null)
      .filter((parsedTransaction) =>
        fetchTransactionsParam.startTime
          ? parsedTransaction?.blockTime && parsedTransaction.blockTime >= fetchTransactionsParam.startTime
          : true
      )
      .filter((parsedTransaction) =>
        fetchTransactionsParam.endTime
          ? parsedTransaction?.blockTime && parsedTransaction.blockTime <= fetchTransactionsParam.endTime
          : true
      )
      .filter((parsedTransaction) =>
        customFilter ? parsedTransaction !== null && customFilter(parsedTransaction) : true
      );


    transactions.push(...filteredTransactions);
    if (customProcessor) {
      filteredTransactions.forEach((parsedTransaction) => {
        if (parsedTransaction) {
          customProcessor(parsedTransaction);
        }
      });
    }

    // if we have fetched all `count` transactions, break
    if (remainTransactionsCount === 0) break;
    if (parsedTransactions.length === 0) break;

    const lastTransaction = parsedTransactions.at(-1);
    // Continue to fetch from the last transaction
    beforeTransactionSignature = lastTransaction?.transaction.signatures[0] ?? undefined;
    if (fetchTransactionsParam.startTime && lastTransaction) {
      // if the last transaction is before the start time, break
      if (lastTransaction.blockTime && lastTransaction.blockTime < fetchTransactionsParam.startTime) break;
    }
    if (transactionSignatures.length === 0) {
      break;
    }
  }

  return { parsedTransactions: transactions, processedTransactions: [] };
}

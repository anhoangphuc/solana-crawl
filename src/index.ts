import { PublicKey, Connection, ParsedTransactionWithMeta, Keypair } from '@solana/web3.js';
import { fetchTransactionsFromProgramId } from './services/fetcher';
import { convertDateStringToUnixTimeSecond } from './utils';
import { Context, KYC_PROGRAM_ID_MAINNET, ProviderClient } from '@renec-foundation/kyc-sdk';
import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { TokenAccountNotFoundError, getAccount } from 'solana-spl-token';
import fs from 'fs';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { downloadTokenList, fetchTokensCdn } from './utils/renec-rpl';
import { RENEC_URL_CDN } from './utils/renec-rpl/constants';

(async () => {
  const result = await fetchTokensCdn(RENEC_URL_CDN, [new PublicKey('2kNzm2v6KR5dpzgavS2nssLV9RxogVP6py2S6doJEfuZ')]);
  console.log(result);
})();

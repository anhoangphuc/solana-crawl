import { PublicKey } from '@solana/web3.js';
import { fetchTokensCdn } from './utils/renec-rpl/index';
import { RENEC_URL_CDN } from './utils/renec-rpl/constants';

(async () => {
  const result = await fetchTokensCdn(RENEC_URL_CDN, [new PublicKey('2kNzm2v6KR5dpzgavS2nssLV9RxogVP6py2S6doJEfuZ')]);
  console.log(result);
})();

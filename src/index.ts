import { Connection, PublicKey } from '@solana/web3.js';
import { fetchTokensCdn } from './utils/renec-rpl/index';
import { RENEC_URL_CDN } from './utils/renec-rpl/constants';
import { getAccount } from 'solana-spl-token';

(async () => {
  const connection = new Connection('https://api-testnet.renec.foundation:8899/', 'confirmed');
  const data = await connection.getAccountInfo(new PublicKey('ADX3aUWbZm2snLRSVTSWJduksjYKprUcPLaXHeGpBYfK'));
  console.log(data);
  // const tokenAccount = await getAccount(connection, new PublicKey('3KFGQJStd4hv2Ac2CfMkqEMz4pqbq6SdPCuVJk1UMfeE'));

  // console.log(tokenAccount);
})();

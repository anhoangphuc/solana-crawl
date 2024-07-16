import axios from 'axios';
import { Token, UTLCdnTokenList, keysMapType } from './types';
import { PublicKey } from '@solana/web3.js';

export async function downloadTokenList(cdnUrl: string): Promise<UTLCdnTokenList | null> {
  try {
    const { data } = await axios.get<UTLCdnTokenList>(cdnUrl);
    return data;
  } catch (error) {
    return null;
  }
}

export const publicKeysToMap = (keys: PublicKey[]): keysMapType => {
  return keys.reduce((acc, cur) => {
    acc[cur.toString()] = true;
    return acc;
  }, {} as keysMapType);
};

export async function fetchTokensCdn(cdnUrl: string, mints: PublicKey[]): Promise<Token[]> {
  const tokenlist = await downloadTokenList(cdnUrl);
  const mintsMap = publicKeysToMap(mints);

  return tokenlist?.tokens.filter((token) => mintsMap[token.address]) ?? [];
}

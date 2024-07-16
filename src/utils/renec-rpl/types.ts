export enum Tag {
  LP_TOKEN = 'lp-token'
}

export interface Token {
  name: string;
  symbol: string;
  logoURI: string | null;
  verified?: boolean;
  address: string;
  tags?: Set<Tag>;
  decimals: number | null;
  holders?: number | null;
}

export interface UTLCdnTokenList {
  name: string;
  logoURI: string;
  keywords: string[];
  tags: Set<Tag>;
  timestamp: string;
  tokens: Token[];
}

export interface keysMapType {
  [key: string]: boolean;
}

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, generateSigner, none } from '@metaplex-foundation/umi';
import { mplTokenMetadata, createNft } from '@metaplex-foundation/mpl-token-metadata';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';

const umi = createUmi('https://api.devnet.solana.com').use(mplTokenMetadata());

const secretKey = '';

const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(secretKey));

umi.use(keypairIdentity(keypair));

(async () => {
  try {
    const mint = generateSigner(umi);
    console.log('mint address', mint.publicKey, umi.identity.publicKey);
    await createNft(umi, {
      mint,
      name: 'RepayVoucher',
      symbol: 'REPV',
      uri: 'https://gist.githubusercontent.com/anhoangphuc/9f8a7a6c3dae1a6bd9ff7ffa22dad6f6/raw/0a0b99b13882051c00e28b4a56c0c415e9f0ba89/voucher_metadata.json',
      sellerFeeBasisPoints: {
        basisPoints: BigInt(0),
        identifier: '%',
        decimals: 2
      },
      collection: none(),
      creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }]
    }).sendAndConfirm(umi);
  } catch (error) {
    console.error(error);
    throw error;
  }
})();

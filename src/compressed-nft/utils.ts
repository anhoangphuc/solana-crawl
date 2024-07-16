import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, mintV1 } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import os from 'os';
import fs from 'fs';

const umi = createUmi('https://devnet.solana.com').use(mplTokenMetadata());

const wallet = `${os.homedir}/.config/solana/id.json`;
const secretKey = JSON.parse(fs.readFileSync(wallet, 'utf8'));

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));

umi.use(keypairIdentity(keypair));

(async () => {
  const merkleTree = generateSigner(umi);
  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64
  });

  const buildTreeTx = await builder.sendAndConfirm(umi);
  console.log(`Build tree tx success ${buildTreeTx}`);
})();

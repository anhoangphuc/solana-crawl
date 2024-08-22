import { getKeypairFromFile } from '@solana-developers/helpers';
import { Connection } from '@solana/web3.js';
import * as token from 'solana-spl-token';
import * as web3 from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { createCreateInstruction } from 'mpl-token-metadata-231';
import { Constants } from '../services/constants';

(async () => {
  const keypair = await getKeypairFromFile('~/.config/solana/id.json');
  const connectionURI = Constants.SOLANA_DEVNET.RPC_URL;
  const connection = new Connection(connectionURI, 'confirmed');

  const mintKeypair = web3.Keypair.generate();
  const metaplex = new Metaplex(connection as any);
  const createMintAccountInstruction = web3.SystemProgram.createAccount({
    fromPubkey: keypair.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: token.MINT_SIZE,
    lamports: await connection.getMinimumBalanceForRentExemption(token.MINT_SIZE),
    programId: token.TOKEN_PROGRAM_ID
  });

  const initializeMintIns = await token.createInitializeMintInstruction(
    mintKeypair.publicKey,
    9,
    keypair.publicKey,
    keypair.publicKey
  );

  const associatedToken = await token.getAssociatedTokenAddress(mintKeypair.publicKey, keypair.publicKey);
  const initializeTokenAccountIns = await token.createAssociatedTokenAccountInstruction(
    keypair.publicKey,
    associatedToken,
    keypair.publicKey,
    mintKeypair.publicKey
  );


  const metadataAddress = await metaplex.nfts().pdas().metadata({ mint: mintKeypair.publicKey });
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata().address;
  console.log(`tokenMetadataProgram: ${tokenMetadataProgram}`);

  const mintToIns = await token.createMintToInstruction(
    mintKeypair.publicKey,
    associatedToken,
    keypair.publicKey,
    1000000000000000000,
  );

  const createCreateIns = createCreateInstruction(
    {
      metadata: metadataAddress,
      mint: mintKeypair.publicKey,
      authority: keypair.publicKey,
      payer: keypair.publicKey,
      updateAuthority: keypair.publicKey,
      sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      splTokenProgram: token.TOKEN_PROGRAM_ID
    },
    {
      createArgs: {
        assetData: {
          uri: 'https://gist.githubusercontent.com/phuctbh0808/f4cc5204707cb50debc8e1bd91305919/raw/5da1f2103b141851c5881fd8072f695db8e0ca48/PROP.json',
          name: 'Propeasy Token',
          symbol: 'PROP',
          sellerFeeBasisPoints: 0,
          creators: null,
          isMutable: true,
          primarySaleHappened: false,
          tokenStandard: 2,
          collection: null,
          uses: null,
          collectionDetails: null,
          ruleSet: null
        },
        decimals: 9,
        __kind: 'V1',
        printSupply: null
      }
    },
    tokenMetadataProgram,
  );

  const transaction = new web3.Transaction().add(
    createMintAccountInstruction,
    initializeMintIns,
    initializeTokenAccountIns,
    mintToIns,
    createCreateIns
  );

  try {
    const txHash = await web3.sendAndConfirmTransaction(connection, transaction, [keypair, mintKeypair]);
    console.log(`Create token ${mintKeypair.publicKey.toBase58()} success at tx `, txHash);
  } catch (error) {
    console.error(error);
    throw error;
  }
})();

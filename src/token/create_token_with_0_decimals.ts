import { getKeypairFromFile } from '@solana-developers/helpers';
import { Connection } from '@solana/web3.js';
import * as token from 'solana-spl-token';
import * as web3 from '@solana/web3.js';
import { CreateMetadata, CreateMetadataV2, Metadata, MetadataDataData } from '@renec-foundation/mpl-token-metadata';
import {  createCreateInstruction } from 'mpl-token-metadata-231';

(async () => {
    const keypair = await getKeypairFromFile('~/.config/renec/deployer_testnet.json');
    const connectionURI = 'https://api-testnet.renec.foundation:8899/';    
    const connection = new Connection(connectionURI, 'confirmed');

    const mintKeypair = web3.Keypair.generate();
    const createMintAccountInstruction = web3.SystemProgram.createAccount({
        fromPubkey: keypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: token.MINT_SIZE,
        lamports: await connection.getMinimumBalanceForRentExemption(token.MINT_SIZE),
        programId: token.TOKEN_PROGRAM_ID,
    });

    const initializeMintIns = await token.createInitializeMintInstruction(
        mintKeypair.publicKey,
        0,
        keypair.publicKey,
        keypair.publicKey,
    );

    const associatedToken = await token.getAssociatedTokenAddress(mintKeypair.publicKey, keypair.publicKey);
    const initializeTokenAccountIns = await token.createAssociatedTokenAccountInstruction(
        keypair.publicKey,
        associatedToken,
        keypair.publicKey,
        mintKeypair.publicKey,
    );

    const tokenAddress = new web3.PublicKey("8NoZYiawFCNhGUSDoLAy3xr2DMCKnnn96vbTvjw8Ykzs");

    const metadataAddress = await Metadata.getPDA(tokenAddress);

    const mintToIns = await token.createMintToInstruction(
        mintKeypair.publicKey,
        associatedToken,
        keypair.publicKey,
        1000000000,
    );

    const createCreateIns = createCreateInstruction(
        {
            metadata:  metadataAddress,
            mint: mintKeypair.publicKey,
            authority: keypair.publicKey,
            payer: keypair.publicKey,
            updateAuthority: keypair.publicKey,
            sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: token.TOKEN_PROGRAM_ID, 
        },
        {
            createArgs: {
                assetData: {
                    uri: 'https://gist.githubusercontent.com/phuctbh0808/dc25819365f1da9031ddea6933b7d5f5/raw/15a668c494a30ab26dc3640152cdeb3b7356d6e1/new_vnd.json',
                    symbol: 'VND',                    
                    name: 'VND',
                    sellerFeeBasisPoints: 0,
                    creators: null,
                    isMutable: true,
                    primarySaleHappened: false,
                    tokenStandard: 2,
                    collection: null,
                    uses: null,
                    collectionDetails: null,
                    ruleSet: null,
                },
                decimals: 0,
                __kind: "V1",
                printSupply: null,
            }
        },
        new web3.PublicKey('metaXfaoQatFJP9xiuYRsKkHYgS5NqqcfxFbLGS5LdN'),
    );

    const transaction = new web3.Transaction()
    .add(
        createMintAccountInstruction,
        initializeMintIns,
        initializeTokenAccountIns,
        mintToIns,
        createCreateIns,
    );

    try {
        // const txHash = await web3.sendAndConfirmTransaction(connection, transaction, [keypair, mintKeypair]);
        // console.log(`Create mint ${mintKeypair.publicKey.toBase58()} success at txHash `, txHash);
        const tx = new CreateMetadata(
            {
                feePayer: keypair.publicKey,
            },
            {
                metadata: metadataAddress,
                metadataData: new MetadataDataData({
                    name: 'VND',
                    symbol: 'VND',
                    uri: 'https://gist.githubusercontent.com/phuctbh0808/dc25819365f1da9031ddea6933b7d5f5/raw/15a668c494a30ab26dc3640152cdeb3b7356d6e1/new_vnd.json',
                    creators: null,
                    sellerFeeBasisPoints: 0,
                 }),
                updateAuthority: keypair.publicKey,
                mint: tokenAddress,
                mintAuthority: keypair.publicKey,
            }
        );

        const txHash2 = await web3.sendAndConfirmTransaction(connection, tx, [keypair]);
        console.log("Create metadata success at tx ", txHash2);
    } catch (error) {
        console.error(error);
        throw error;
    }
})()
import { Connection, ParsedTransactionWithMeta } from "@solana/web3.js";
import { fetchTransactionsFromProgramId } from "../services/fetcher";
import dotenv from 'dotenv';
import { Constants } from "../services/constants";
import { convertDateStringToUnixTimeSecond, convertUnixTimeToDateString } from "../utils";
dotenv.config();

(async () => {
    const globalObj: any = {};
    const endTime = convertDateStringToUnixTimeSecond('02/08/2024 05:38:00');
    const customProcessor = (parsedTransaction: ParsedTransactionWithMeta) => {
        if ((parsedTransaction?.meta)) {
            const postTokenBalances = parsedTransaction.meta.postTokenBalances;
            if (postTokenBalances) {
                postTokenBalances.forEach((tokenBalance) => {
                    if (tokenBalance.mint !== Constants.SOLANA_MAINNET.BODO) {
                        return;
                    }
                    if (globalObj[tokenBalance.owner?.toString() || ""]) {
                        return;
                    }
                    globalObj[tokenBalance.owner?.toString() || ""] = {
                        amount: Number(tokenBalance.uiTokenAmount.amount),
                        sig: parsedTransaction?.transaction.signatures[0],
                    }
                })
            }
            console.log("TX AT ", convertUnixTimeToDateString(parsedTransaction.blockTime || 0), parsedTransaction.transaction.signatures[0]);
        }
    }
    const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    const txs = await fetchTransactionsFromProgramId(
       Constants.SOLANA_MAINNET.BODO,
       HELIUS_RPC,
       {
        pageSize: 10,
        endTime,
       },
       undefined,
      customProcessor,
    )
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join('./data', 'globalObj.json');
    const data = JSON.stringify(globalObj, null, 2);

    fs.writeFile(filePath, data, (err: any) => {
        if (err) throw err;
        console.log('Data has been saved to globalObj.json');
    });
})()
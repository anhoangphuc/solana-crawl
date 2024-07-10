import { fetchTransactionsFromProgramId } from "./services/fetcher";
import { convertDateStringToUnixTimeSecond } from "./utils";

const connection = "https://api-mainnet-beta.renec.foundation:8899/";
const programId = "48qby9KswHa1dWa6xYKSYPju3oidfG6aZqDn8jSfpbcR";

(async () => {
    const startTime = convertDateStringToUnixTimeSecond("08/07/2024 00:00:00")
    const endTime = convertDateStringToUnixTimeSecond("09/07/2024 00:00:00")
    const txs = await fetchTransactionsFromProgramId(programId, connection, { pageSize: 50, startTime, endTime });
    console.log(txs);
})();

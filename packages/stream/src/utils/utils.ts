import { AnchorProvider } from "@project-serum/anchor"
import { ParsedAccountData, SYSVAR_CLOCK_PUBKEY, TransactionSignature } from "@solana/web3.js"


export const getClusterTime = async(provider: AnchorProvider) => {
    const parsedClock = await provider.connection.getParsedAccountInfo(SYSVAR_CLOCK_PUBKEY)
    const parsedClockAccount = (parsedClock.value!.data as ParsedAccountData).parsed;
    const clusterTimestamp = parsedClockAccount.info.unixTimestamp;
    return clusterTimestamp
};

export const getTxTime = async(provider:AnchorProvider, tx: TransactionSignature) => {
    await new Promise((r) => setTimeout(r, 1000));
    let startStreamTxTime = await provider.connection.getTransaction(
        tx,
        {
            commitment: "confirmed"
        }
    );
    let { blockTime } = startStreamTxTime;
    return blockTime
};

export const now = () => {
    return new Date().getTime();
};

export async function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

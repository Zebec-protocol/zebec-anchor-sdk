import { Connection, ParsedAccountData, SYSVAR_CLOCK_PUBKEY, TransactionSignature, ConfirmOptions, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";


export const getAmountInLamports = (amount: number): number => {
    return amount * LAMPORTS_PER_SOL
};

export const getTokenAmountInLamports = async (amount: number, tokenMintAddress: PublicKey, program: Program): Promise<number> => {
    // get Amount Decimal Digit number
    const tokenMetaData = await program.provider.connection.getTokenSupply(tokenMintAddress);
    const decimals = tokenMetaData.value?.decimals;
    return amount * decimals
}


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

export const initAnchorProvider = (
    wallet: Wallet,
    rpcUrl: string,
    opts?: ConfirmOptions
) => {
    opts = opts ?? AnchorProvider.defaultOptions();
    const connection = new Connection(
        rpcUrl ?? "http://localhost:8899",
        opts.preflightCommitment
    );
    const provider = new AnchorProvider(connection, wallet, opts);
    return provider
}

export class ConsoleLog {
    readonly logger: boolean;
    constructor(logger: boolean) {
        this.logger = logger;
    }

    info(message: string) {
        if (this.logger) { console.log(message); }
    }

    error(message: string) {
        if (this.logger) { console.error(message); }
    }

    warning(message: string) {
        if(this.logger) { console.warn(message); }
    }
}
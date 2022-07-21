import { Connection, ParsedAccountData, SYSVAR_CLOCK_PUBKEY, TransactionSignature, ConfirmOptions, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";


const getErrorForTransaction = async (connection: Connection, txid: TransactionSignature) => {
    // wait for all confirmation before geting transaction
    const commitment = "finalized";
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    await connection.confirmTransaction(
        { signature: txid, ...latestBlockhash },
        commitment
    );

    const tx = await connection.getParsedTransaction(txid, commitment);
    const errors: string[] = [];

    if(tx?.meta && tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log: any) => {
            const regex = /Error: (.*)/gm;
            let m: any;
            while((m = regex.exec(log)) !== null) {
                // this is necessary to avoid infinite loops with zero-width matches
                if(m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (m.length > 1) {
                    errors.push(m[1]);
                }
            }
        })
    }
    return errors;
}

export const sendOne = async(tx: Transaction, provider: AnchorProvider): Promise<TransactionSignature> => {
    console.log("--- smart txn - sending one...", tx);
    const connection = provider.connection;
    const rawTxn = tx.serialize();

    let options = {
        skipPreflight: false,
        commitment: provider.connection.commitment
    };

    const startTime = now();
    let done = false;
    const retryTimeout = 3000; //ms

    const txid = await connection.sendRawTransaction(rawTxn, options);
    (async () => {
        while(!done && now() - startTime < retryTimeout) {
            connection.sendRawTransaction(rawTxn, options);
            console.log(
                "retry sending transaction continuously every 2 seconds...",
                txid
            );
            await sleep(2000);
        }
    })();

    let status: any;

    try {
        const signatureResult = await connection.confirmTransaction(
            {
                signature: txid,
                blockhash: tx.recentBlockhash,
                lastValidBlockHeight: tx.lastValidBlockHeight
            } as any,
            provider.connection.commitment
        );
        status = signatureResult.value;
    } catch (error) {
        status = {
            err: error
        };
    } finally {
        done = true;
    }

    if (status?.err) {
        let errors: string[] = [];
        if (
            (status.err as Error).message &&
            ((status.err as Error).message.includes("block height exceeded") ||
            (status.err as Error).message.includes("timeout exceeded"))
        ) {
            errors = [(status.err as Error).message];
        } else {
            errors = await getErrorForTransaction(connection, txid);
        }

        throw new Error(
            `Raw transaction ${txid} faied (${JSON.stringify(status)})`
        );
    }
    return txid;
}

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

    info(message: string, value: any = null) {
        if (this.logger) { 
            if (value) {
                console.log(message, value); 
            }
            console.log(message);
        }
    }

    error(message: string, value: any = null) {
        if (this.logger) { 
            if (value) {
                console.error(message, value); 
            }
            console.error(message);
         }
    }

    warning(message: string, value: any = null) {
        if(this.logger) { 
            if (value) {
                console.warn(message, value); 
            }
            console.warn(message);
         }
    }
}
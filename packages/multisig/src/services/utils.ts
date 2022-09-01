import { Connection, ParsedAccountData, SYSVAR_CLOCK_PUBKEY, TransactionSignature, ConfirmOptions, LAMPORTS_PER_SOL, PublicKey, Transaction, AccountMeta } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";
import { ZEBEC_MULTISIG_PROGRAM_IDL } from "../idl";


export const parseErrorMessage = (message: string): string => {
    const regex = /error: 0x(.*)/gm;
    const errors = ZEBEC_MULTISIG_PROGRAM_IDL.errors;

    let m: any, errcode: number;

    while ((m = regex.exec(message)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) { regex.lastIndex++; }
        if (m.length >  1) { errcode = parseInt(m[1], 16);}
    }

    const errObj = errors.find(e => e.code === errcode)
    if (errcode && errObj) { return errObj.msg.toLowerCase() }

    return message
}

const getErrorForTransaction = async (connection: Connection, txid: TransactionSignature) => {
    // wait for all confirmation before geting transaction
    const commitment = "finalized";
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    await connection.confirmTransaction(
        { signature: txid, ...latestBlockhash },
        commitment
    );

    const tx = await connection.getParsedTransaction(txid, commitment);
    console.log("parsed transaction: ", tx);
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

export const sendTx = async(tx: Transaction, provider: AnchorProvider): Promise<TransactionSignature> => {
    console.log("------ sending transaction --------", tx);
    // tx.instructions.map(i => i.keys.map(k => console.log(k.pubkey.toBase58(), k.isSigner, k.isWritable)))
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

    console.log("status: ", status);

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
    const connection = program.provider.connection;
    const tokenMetaData = await connection.getTokenSupply(tokenMintAddress);
    const decimals = tokenMetaData.value?.decimals;
    return amount * Math.pow(10, decimals);
};

export const getClusterTime = async(provider: AnchorProvider) => {
    const parsedClock = await provider.connection.getParsedAccountInfo(SYSVAR_CLOCK_PUBKEY)
    const parsedClockAccount = (parsedClock.value!.data as ParsedAccountData).parsed;
    const clusterTimestamp = parsedClockAccount.info.unixTimestamp;
    return clusterTimestamp
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
        if (this.logger && value) { 
            console.log(message, value); 
        }
        console.log(message);
    }
}

export const getTxSize = (
    accounts: Array<AccountMeta>,
    owners: Array<PublicKey>,
    isDataVector: boolean,
    data_size:number,
  ) => {
    const vec_discriminator = 8;
    const discriminator = 8;
    const pubkey_size = 32;
    const account_size = vec_discriminator + accounts.length * (32 + 1 + 1);
    let datasize = discriminator + data_size;
    if (isDataVector) {
      datasize = data_size + vec_discriminator;
    }
    const num_owner = owners.length ;
    const sig_vec_size = vec_discriminator + num_owner * 1;
    const txSize =
      discriminator +
      pubkey_size + //multisig program id
      pubkey_size + // program id
      account_size + //account vector
      datasize + //size of data
      sig_vec_size + //signed vector
      1 + //did execute bool
      4; //Owner set sequence number.
    return txSize;
  };
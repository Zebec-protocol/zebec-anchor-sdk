import { AnchorProvider, Wallet } from "@project-serum/anchor";
import { Connection, Keypair, Transaction, TransactionInstruction, TransactionSignature } from "@solana/web3.js";
// import { InstructionsAndSigners } from "../models";
import { ConfirmOptions } from "@solana/web3.js";


// const DEFAULT_TIMEOUT = 30000;
// const now = () => {
//     return new Date().getTime();
// };

// export async function sleep(ms: any) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   }

export class TransactionSender {
    provider: AnchorProvider;

    constructor(provider: AnchorProvider) {
        this.provider = provider;
    }

    async makeTxn(instruction: TransactionInstruction, escrow: Keypair = null): Promise<Transaction> {
        let transaction = new Transaction().add(instruction);
        const latestBlockhash = await this.provider.connection.getLatestBlockhash(
            this.provider.connection.commitment
        );
        console.log("fee payer", this.provider.wallet.publicKey.toString())
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        transaction.feePayer = this.provider.wallet.publicKey

        if (escrow) {
            transaction.partialSign(escrow);
        }
        return transaction
    }

    getErrorForTransaction = async (connection: Connection, txid: string) => {
        // wait for all confirmation before geting transaction
        const commitment = "finalized"; // https://stackoverflow.com/a/68751515/1064858
        const latestBlockhash = await connection.getLatestBlockhash(commitment);
        await connection.confirmTransaction(
          { signature: txid, ...latestBlockhash },
          commitment
        );
    
        const tx = await connection.getParsedTransaction(txid, commitment);
        const errors: string[] = [];
        if (tx?.meta && tx.meta.logMessages) {
          tx.meta.logMessages.forEach((log: any) => {
            const regex = /Error: (.*)/gm;
            let m;
            while ((m = regex.exec(log)) !== null) {
              // This is necessary to avoid infinite loops with zero-width matches
              if (m.index === regex.lastIndex) {
                regex.lastIndex++;
              }
    
              if (m.length > 1) {
                errors.push(m[1]);
              }
            }
          });
        }
    
        return errors;
      };

    async sendOne(txn: Transaction): Promise<string> {
        const connection = this.provider.connection;
        const signedTx = await this.provider.wallet.signTransaction(txn);
        console.log(signedTx, "signed transaction");
        const rawTxn = signedTx.serialize();

        // signedTx["signatures"].forEach(sig => {
        //    console.log(sig.publicKey.toBase58()) 
        // });

        let options = {
            skipPreflight: true,
            commitment: "this.provider.connection.commitment"
        };

        // const startTime = now()
        // let done = false;
        // const retryTimeout = DEFAULT_TIMEOUT;

        const txid = await connection.sendRawTransaction(rawTxn, options);
        console.log(txid, "ID before confirming")
        await connection.confirmTransaction({
                        signature: txid,
                        blockhash: txn.recentBlockhash,
                        lastValidBlockHeight: txn.lastValidBlockHeight
                    } as any, this.provider.opts.commitment)

        return txid
        // console.log("Transaction ID Raw: ", txid);

        // (async() => {
        //     while(!done && now() - startTime < retryTimeout) {
        //         connection.sendRawTransaction(rawTxn, options);
        //         console.log(
        //             "retry sending transaction continuously every 2 seconds...",
        //             txid
        //         );
        //         await sleep(2000);
        //     }
        // })();

        // let status: any;

        // try {
        //     const signatureResult = await connection.confirmTransaction(
        //         {
        //             signature: txid,
        //             blockhash: txn.recentBlockhash,
        //             lastValidBlockHeight: txn.lastValidBlockHeight
        //         } as any,
        //         this.provider.connection.commitment
        //     );
        //     status = signatureResult.value;
        // } catch (error) {
        //     status = {
        //         err: error
        //     }
        // } finally {
        //     done = true;
        // }

        // if (status?.err) {
        //     let errors: string[];
        //     if (
        //         (status.err as Error).message &&
        //         ((status.err as Error).message.includes("block height exceeded") ||
        //         (status.err as Error).message.includes("timeout exceeded"))
        //     ) {
        //         errors = [(status.err as Error).message];
        //     } else {
        //         errors = await this.getErrorForTransaction(connection, txid);
        //     }

        //     throw new Error(
        //         `Raw Transaction ${txid} failed (${JSON.stringify(status)})`
        //     );
        // } else {
        //     console.log(txid)
        // }
        // return txid
    }
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
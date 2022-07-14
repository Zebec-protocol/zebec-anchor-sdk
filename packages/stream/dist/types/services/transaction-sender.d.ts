import { AnchorProvider, Wallet } from "@project-serum/anchor";
import { Connection, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ConfirmOptions } from "@solana/web3.js";
export declare class TransactionSender {
    provider: AnchorProvider;
    constructor(provider: AnchorProvider);
    makeTxn(instruction: TransactionInstruction, escrow?: Keypair): Promise<Transaction>;
    getErrorForTransaction: (connection: Connection, txid: string) => Promise<string[]>;
    sendOne(txn: Transaction): Promise<string>;
}
export declare const initAnchorProvider: (wallet: Wallet, rpcUrl: string, opts?: ConfirmOptions) => AnchorProvider;

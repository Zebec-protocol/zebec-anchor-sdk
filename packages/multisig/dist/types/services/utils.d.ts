import { TransactionSignature, ConfirmOptions, PublicKey, Transaction, AccountMeta } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";
export declare const parseErrorMessage: (message: string) => string;
export declare const sendTx: (tx: Transaction, provider: AnchorProvider) => Promise<TransactionSignature>;
export declare const getAmountInLamports: (amount: number) => number;
export declare const getTokenAmountInLamports: (amount: number, tokenMintAddress: PublicKey, program: Program) => Promise<number>;
export declare const getClusterTime: (provider: AnchorProvider) => Promise<any>;
export declare const now: () => number;
export declare function sleep(ms: any): Promise<unknown>;
export declare const initAnchorProvider: (wallet: Wallet, rpcUrl: string, opts?: ConfirmOptions) => AnchorProvider;
export declare class ConsoleLog {
    readonly logger: boolean;
    constructor(logger: boolean);
    info(message: string, value?: any): void;
}
export declare const getTxSize: (accounts: Array<AccountMeta>, owners: Array<PublicKey>, isDataVector: boolean, data_size: number) => number;

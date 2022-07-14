import { AnchorProvider } from "@project-serum/anchor";
import { TransactionSignature } from "@solana/web3.js";
export declare const getClusterTime: (provider: AnchorProvider) => Promise<any>;
export declare const getTxTime: (provider: AnchorProvider, tx: TransactionSignature) => Promise<number>;

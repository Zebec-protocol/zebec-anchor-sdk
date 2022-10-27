import { PublicKey, Signer, TransactionInstruction, TransactionSignature } from "@solana/web3.js";
export declare type MZebecResponse = {
    status: string;
    message: string | Error;
    data: MStreamResponse | null;
};
export declare type MStreamResponse = {
    transactionHash: TransactionSignature;
    pda?: PublicKey | string;
    withdrawescrow?: PublicKey | string;
};
export declare type MInstructionsAndSigners = {
    instructions: TransactionInstruction[];
    signers?: Signer[];
};
export declare type MDepositWithdrawFromZebecVault = {
    sender: string;
    amount: number;
    token_mint_address?: string;
};
export declare type MInitStream = {
    sender: string;
    receiver: string;
    start_time: number;
    end_time: number;
    amount: number;
    token_mint_address?: string;
    withdraw_limit?: number;
};
export declare type MUpdateStream = {
    sender: string;
    receiver: string;
    escrow: string;
    start_time: number;
    end_time: number;
    amount: number;
    token_mint_address?: string;
    withdraw_limit?: number;
};
export declare type MPauseResumeWithdrawCancel = {
    sender: string;
    receiver: string;
    escrow: string;
    token_mint_address?: string;
};

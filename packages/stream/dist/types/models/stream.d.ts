import { PublicKey, Signer, TransactionInstruction, TransactionSignature } from "@solana/web3.js";
export declare type ZebecResponse = {
    status: string;
    message: string | Error;
    data: StreamResponse | null;
};
export declare type StreamResponse = {
    transactionHash: TransactionSignature;
    pda?: PublicKey | string;
};
export declare type InstructionsAndSigners = {
    instructions: TransactionInstruction[];
    signers?: Signer[];
};
export declare type DepositWithdrawFromZebecVault = {
    sender: string;
    amount: number;
    token_mint_address?: string;
};
export declare type InitStream = {
    sender: string;
    receiver: string;
    start_time: number;
    end_time: number;
    amount: number;
    token_mint_address?: string;
    withdraw_limit?: number;
};
export declare type PauseResumeWithdrawCancel = {
    sender: string;
    receiver: string;
    escrow: string;
    token_mint_address?: string;
};

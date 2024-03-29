import { PublicKey, Signer, TransactionInstruction, TransactionSignature } from "@solana/web3.js";

export type MZebecResponse = {
    status: string;
    message: string | Error;
    data: MStreamResponse | null;
}

export type MStreamResponse = {
    transactionHash: TransactionSignature;
    pda?: PublicKey | string;
    withdrawescrow?: PublicKey | string;
}

export type MInstructionsAndSigners = {
    instructions: TransactionInstruction[];
    signers?: Signer[];
};


export type MDepositWithdrawFromZebecVault = {
    sender: string;
    amount: number;
    token_mint_address?: string;
}

export type MCreateFeeVault = {
    fee_percentage: number;
}

export type MCollectTokenFees = {
    token_mint_address: string;
}

export type MInstantTransfer = {
    sender: string;
    receiver: string;
    token_mint_address?: string;
    amount: number;
}

export type MFetchStreamingAmount = {
    sender: string;
    token_mint_address?: string;
}

export type MInitStream = {
    sender: string;
    receiver: string;
    start_time: number;
    end_time: number;
    amount: number;
    token_mint_address?: string;
    withdraw_limit?: number;
}

export type MUpdateStream = {
    sender: string;
    receiver: string;
    escrow: string;
    start_time: number;
    end_time: number;
    amount: number;
    token_mint_address?: string;
    withdraw_limit?: number;
}

export type MPauseResumeWithdrawCancel = {
    sender: string;
    receiver: string;
    escrow: string;
    token_mint_address?: string;
}
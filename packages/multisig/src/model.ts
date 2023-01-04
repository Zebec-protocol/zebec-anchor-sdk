import { PublicKey, Signer, TransactionInstruction, TransactionSignature } from "@solana/web3.js";

export type MZebecResponse = {
    status: string;
    message: string | Error;
    data: MStreamResponse | null;
}

export type MCreateSafe = {
    owners: Array<String>;
    min_confirmation_required: number;
}

export type MCreateFeeVault = {
    fee_percentage: number;
}

export type MdepositSolToSafe = {
    sender: string;
    safe_address: string;
    amount: number;
    token_mint_address?: string;
}

export type Mdeposit = {
    safe_address: string;
    safe_data_account: string;
    sender: string;
    amount: number;
    token_mint_address?: string;
}

export type MExecDeposit = {
    safe_address: string;
    safe_data_account: string;
    transaction_account: string;
    signer: PublicKey;
    token_mint_address?: string;
}


export type MExecInit = {
    stream_data_account: string;
    safe_address: string;
    safe_data_account: string;
    transaction_account: string;
    receiver: string;
    signer: PublicKey;
    token_mint_address?: string;
}

export type MExecUpdateStream = {
    stream_data_account: string;
    safe_address: string;
    safe_data_account: string;
    transaction_account: string;
    receiver: string;
    signer: PublicKey;
    token_mint_address?: string;
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

export type MInitStream = {
    safe_address: string;
    safe_data_account: string;
    sender: string;
    receiver: string;
    start_time: number;
    end_time: number;
    amount: number;
    token_mint_address?: string;
    withdraw_limit?: number;
}

export type MUpdateStream = {
    safe_address: string;
    safe_data_account: string;
    sender: string;
    receiver: string;
    escrow: string;
    start_time: number;
    end_time: number;
    amount: number;
    stream_data_account: string;
    token_mint_address?: string;
    withdraw_limit?: number;
}

export type MPauseResumeWithdrawCancel = {
    safe_address: string;
    stream_data_account: string;
    safe_data_account: string;
    sender: string;
    receiver: string;
    escrow: string;
    token_mint_address?: string;
}

export type MExecPauseResumeWithdrawCancel = {
    stream_data_account: string;
    safe_address: string;
    safe_data_account: string;
    transaction_account: string;
    receiver: string;
    signer: PublicKey;
    token_mint_address?: string;
}

export type MInstantTransfer = {
    safe_address: string;
    receiver: string;
    safe_data_account: string;
    sender: string;
    amount: number;
    token_mint_address?: string;
}

export type MExecInstantTransfer = {
    safe_address: string;
    safe_data_account: string;
    transaction_account: string;
    token_mint_address?: string;
    receiver: string;
    signer: PublicKey;
}

export type MTransferFromSafe = {
    sender: string;
    safe_address: string;
    receiver: string;
    safe_data_account: string;
    token_mint_address?: string;
    amount: number;
}

export type MExecTransferFromSafe = {
    safe_address: string;
    safe_data_account: string;
    transaction_account: string;
    receiver: string;
    token_mint_address?: string;
    signer: PublicKey;
}

export type MWithdraw = {
    safe_address: string;
    receiver: string;
    escrow: string;
    token_mint_address?: string;
}

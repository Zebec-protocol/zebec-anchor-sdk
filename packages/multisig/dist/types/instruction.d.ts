import { Program } from "@project-serum/anchor";
import { AccountMeta, Keypair, PublicKey, Transaction } from "@solana/web3.js";
export declare class ZebecTransactionBuilder {
    readonly _multisigProgram: Program;
    readonly _streamProgram: Program;
    constructor(multisigProgram: Program, streamProgram: Program);
    execApproveTransaction(multisigSafeAddress: PublicKey, zebecAccountAndDataStoringTxAccount: PublicKey, senderAddress: PublicKey): Promise<Transaction>;
    execTransaction(safeAddress: PublicKey, safeDataAccount: PublicKey, zebecTxAccount: PublicKey, remainingAccounts: AccountMeta[]): Promise<any>;
    execCreateSafe(multisigDataAccount: Keypair, multisigSafeNonce: number, owners: PublicKey[], threshold: number): Promise<Transaction>;
    execFeeVault(feeReceiverAddress: PublicKey, feeVaultAddress: PublicKey, feeVaultDataAddress: PublicKey, feePercentage: number): Promise<Transaction>;
    execDepositSol(zebecVaultAddress: PublicKey, senderAddress: PublicKey, receiverAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, amount: number): Promise<Transaction>;
    execDepositToken(zebecVaultAddress: PublicKey, receiverAddress: PublicKey, senderAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, zebecVaultAssociatedTokenAddress: PublicKey, receiverAssociatedTokenAddress: PublicKey, amount: number): Promise<Transaction>;
    execInitStream(safeAddress: PublicKey, safeDataAccount: PublicKey, zebecTransactionAccount: Keypair, streamDataAccountAddress: Keypair, withdrawDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, senderAddress: PublicKey, receiverAddress: PublicKey, startTime: number, endTime: number, amount: number): Promise<Transaction>;
    execPauseStream(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey): Promise<Transaction>;
    execResumeStream(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey): Promise<Transaction>;
    execCancelStream(zebecVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey, withdrawDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey): Promise<Transaction>;
    execInstantStream(zebecVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey, withdrawDataAccountAddress: PublicKey): Promise<Transaction>;
    execStreamInitToken(safeAddress: PublicKey, safeDataAccount: PublicKey, zebecTransactionAccount: Keypair, streamDataAccountAddress: Keypair, withdrawDataAccount: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, senderAddress: PublicKey, receiverAddress: PublicKey, tokenMintAddress: PublicKey, startTime: number, endTime: number, amount: number): Promise<Transaction>;
    execStreamPauseToken(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey): Promise<Transaction>;
    execStreamResumeToken(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey): Promise<Transaction>;
    execStreamCancelToken(zebecVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey, withdrawDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, tokenMintAddress: PublicKey, pdaTokenData: PublicKey, destTokenData: PublicKey, feeTokenData: PublicKey): Promise<Transaction>;
    execInstantStreamToken(zebecVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, zebecTransactionAccount: Keypair, safeDataAccount: PublicKey, senderAddress: PublicKey, withdrawDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, pdaTokenData: PublicKey, destTokenData: PublicKey): Promise<Transaction>;
}

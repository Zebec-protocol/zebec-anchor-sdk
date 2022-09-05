import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
export declare class ZebecTransactionBuilder {
    readonly _program: Program;
    constructor(program: Program);
    execFeeVault(feeReceiverAddress: PublicKey, feeVaultAddress: PublicKey, feeVaultDataAddress: PublicKey, feePercentage: number): Promise<Transaction>;
    execRetrieveSolFees(feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey): Promise<Transaction>;
    execRetrieveTokenFees(feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, tokenMintAddress: PublicKey, feeVaultTokenAccount: PublicKey, feeOwnerTokenAccount: PublicKey): Promise<Transaction>;
    execDepositSolToZebecWallet(senderAddress: PublicKey, zebecVaultAddress: PublicKey, amount: number): Promise<Transaction>;
    execDepositTokenToZebecWallet(zebecVaultAddress: PublicKey, senderAddress: PublicKey, tokenMintAddress: PublicKey, senderAssociatedTokenAddress: PublicKey, zebecVaultAssociatedAccountAddress: PublicKey, amount: number): Promise<Transaction>;
    execWithdrawSolFromZebecVault(senderAddress: PublicKey, zebecVaultAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, amount: number): Promise<Transaction>;
    execWithdrawTokenFromZebecVault(senderAddress: PublicKey, zebecVaultAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, senderAssociatedTokenAddress: PublicKey, escrowAssociatedTokenAddress: PublicKey, amount: number): Promise<Transaction>;
    execStreamInitSol(senderAddress: PublicKey, receiverAddress: PublicKey, escrowAccountKeypair: Keypair, withdrawEscrowDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultAddress: PublicKey, feeVaultDataAddress: PublicKey, startTime: number, endTime: number, amount: number): Promise<Transaction>;
    execStreamWithdrawSol(senderAddress: PublicKey, receiverAddress: PublicKey, zebecVaultAddress: PublicKey, escrowAccountAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultAddress: PublicKey, feeVaultDataAddress: PublicKey): Promise<Transaction>;
    execStreamCancelSol(zebecVaultAddress: PublicKey, senderAddress: PublicKey, receiverAddress: PublicKey, escrowDataAccountAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey): Promise<Transaction>;
    execStreamPauseSol(senderAddress: PublicKey, receiverAddress: PublicKey, escrowAccountAddress: PublicKey): Promise<Transaction>;
    execStreamResumeSol(senderAddress: PublicKey, receiverAddress: PublicKey, escrowAccountAddress: PublicKey): Promise<Transaction>;
    execStreamInitToken(escrowAccountKeypair: Keypair, withdrawEscrowDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultAddress: PublicKey, feeVaultDataAddress: PublicKey, senderAddress: PublicKey, receiverAddress: PublicKey, tokenMintAddress: PublicKey, startTime: number, endTime: number, amount: number): Promise<Transaction>;
    execStreamWithdrawToken(receiverAddress: PublicKey, senderAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feevaultAddress: PublicKey, zebecVaultAddress: PublicKey, escrowAccountAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, zebecVaultAssociatedAccountAddress: PublicKey, receiverAssociatedTokenAddress: PublicKey, feeVaultAssociatedTokenAddress: PublicKey): Promise<Transaction>;
    execStreamCancelToken(senderAddress: PublicKey, receiverAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, zebecVaultAddress: PublicKey, escrowAccountAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, zebecVaultAssociatedTokenAddress: PublicKey, receiverAssociatedTokenAddress: PublicKey, feeVaultAssociatedTokenAddress: PublicKey): Promise<Transaction>;
    execStreamPauseToken(senderAddress: PublicKey, receiverAddress: PublicKey, escrowAccountAddress: PublicKey): Promise<Transaction>;
    execInstantSolTransfer(zebecVaultAddress: PublicKey, senderAddress: PublicKey, receiverAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, amount: number): Promise<Transaction>;
    execInstantTokenTransfer(zebecVaultAddress: PublicKey, receiverAddress: PublicKey, senderAddress: PublicKey, withdrawEscrowDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, zebecVaultAssociatedTokenAddress: PublicKey, receiverAssociatedTokenAddress: PublicKey, amount: number): Promise<Transaction>;
}

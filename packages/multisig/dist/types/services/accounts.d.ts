import { AccountMeta, PublicKey } from "@solana/web3.js";
export declare class AccountKeys {
    static remainingAccounts(accounts: AccountMeta[], safeAddress: PublicKey): AccountMeta[];
    static init(streamDataAccountAddress: PublicKey, withdrawDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey): AccountMeta[];
    static pause(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccount: PublicKey): AccountMeta[];
    static resume(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccount: PublicKey): AccountMeta[];
    static cancel(zebecVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccountAddress: PublicKey, withdrawDataAccountAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey): AccountMeta[];
    static instanttransfer(zebecVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, withdrawDataAccountAddress: PublicKey): AccountMeta[];
    static withdraw(zebecVaultAddress: PublicKey, safeAddress: PublicKey, withdrawDataAccountAddress: PublicKey): AccountMeta[];
    static inittoken(streamDataAccountAddress: PublicKey, withdrawDataAccount: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, safeAddress: PublicKey, receiverAddress: PublicKey, tokenMintAddress: PublicKey): AccountMeta[];
    static pausetoken(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccount: PublicKey): AccountMeta[];
    static resumetoken(safeAddress: PublicKey, receiverAddress: PublicKey, streamDataAccount: PublicKey): AccountMeta[];
    static canceltoken(zebecVaultAddress: PublicKey, receiverAddress: PublicKey, safeAddress: PublicKey, feeReceiverAddress: PublicKey, feeVaultDataAddress: PublicKey, feeVaultAddress: PublicKey, streamDataAccountAddress: PublicKey, withdrawDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, pdaTokenData: PublicKey, dest_token_data: PublicKey, fee_token_data: PublicKey): AccountMeta[];
    static instanttransfertoken(zebecVaultAddress: PublicKey, receiverAddress: PublicKey, safeAddress: PublicKey, withdrawDataAccountAddress: PublicKey, tokenMintAddress: PublicKey, pdaTokenData: PublicKey, destTokenData: PublicKey): AccountMeta[];
}

import { TOKEN_PROGRAM_ID, ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { AccountMeta, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ZEBEC_PROGRAM_ID } from "../config";


export class AccountKeys {

    static remainingAccounts(accounts: AccountMeta[], safeAddress: PublicKey): AccountMeta[] {
        const remainingAccounts = accounts.map(
            (acc: AccountMeta) => {
                if (acc.pubkey.equals(safeAddress)) {
                    return { ...acc, isSigner: false }
                }
                return acc;
            }
        ).concat({
            pubkey: new PublicKey(ZEBEC_PROGRAM_ID.STREAM),
            isWritable: false,
            isSigner: false
        })

        return remainingAccounts
    }

    static deposit(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ]
    }

    static depositToken(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        tokenMintAddress: PublicKey,
        zebecVaultAssociatedTokenAddress: PublicKey,
        pdaTokenData: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false},
            { pubkey: zebecVaultAssociatedTokenAddress, isSigner: false, isWritable: true },
            { pubkey: pdaTokenData, isSigner: false, isWritable: true},
        ]
    }
    
    static init(
        streamDataAccountAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ]
    }

    static updateinit(
        streamDataAccountAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ]
    }

    static pause(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccount: PublicKey
    ): AccountMeta[] {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true }
        ]
    }

    static resume(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccount: PublicKey
    ): AccountMeta[] {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true }
        ]
    }

    static cancel(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } 
        ]

    }


    static instanttransfer(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } 
        ]

    }

    static transferfromsafe(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: true }, 
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } 
        ]

    }

    static transfertokenfromsafe(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        tokenMintAddress: PublicKey,
        destTokenAddress: PublicKey,
        sourceTokenAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: true }, 
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false},
            { pubkey: sourceTokenAddress, isSigner: false, isWritable: true},
            { pubkey: destTokenAddress, isSigner: false, isWritable: true},
        ]

    }

    static withdraw(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey
    ): AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ]
    }

    static inittoken(
        streamDataAccountAddress: PublicKey,
        withdrawDataAccount: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        tokenMintAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccount, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            {pubkey: tokenMintAddress, isSigner: false, isWritable: false},
            {pubkey: SYSVAR_RENT_PUBKEY , isSigner: false, isWritable: false}
        ]
    }

    static updateinittoken(
        streamDataAccountAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        tokenMintAddress: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
        ]
    }

    static pausetoken(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccount: PublicKey,
        tokenMintAddress: PublicKey,
    ) : AccountMeta[] {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
        ]
    }

    static resumetoken(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccount: PublicKey,
        tokenMintAddress: PublicKey,
    ) : AccountMeta[] {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
        ]
    }

    static canceltoken(
        zebecVaultAddress: PublicKey,
        receiverAddress: PublicKey,
        safeAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        pdaTokenData: PublicKey,
        dest_token_data: PublicKey,
        fee_token_data: PublicKey,
    ) : AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY , isSigner: false, isWritable: false},
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false},
            { pubkey: pdaTokenData, isSigner: false, isWritable: true},
            { pubkey: dest_token_data, isSigner: false, isWritable: true},
            { pubkey: fee_token_data, isSigner: false, isWritable: true},
        ]
    }

    static instanttransfertoken(
        zebecVaultAddress: PublicKey,
        receiverAddress: PublicKey,
        safeAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        pdaTokenData: PublicKey,
        destTokenData: PublicKey,
    ): AccountMeta[] {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY , isSigner: false, isWritable: false},
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false},
            { pubkey: pdaTokenData, isSigner: false, isWritable: true},
            { pubkey: destTokenData, isSigner: false, isWritable: true},
        ]

    }
}

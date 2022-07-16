import { BN, Program } from "@project-serum/anchor";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";

/**
 * ## Zebec Instruction Builder 
 *
 * Zebec Instruction Builder object provides a set of
 * dynamically generated instruction that is mapped one-to-one to 
 * program methods.
 * This can be used as follows:
 *
 * ## Usage
 *
 * ```javascript
 * const txBuilder = new ZebecTransactionBuilder(program)
 * txBuilder.<specific-method-for-instruction>
 * ```
 *
 * [here](https://github.com/Zebec-protocol/zebec-anchor-sdk/blob/master/packages/stream/src/builders/stream-instruction.ts).
 */
export class ZebecInstructionBuilder {

    readonly _program: Program;

    public constructor(program: Program) {
        this._program = program;
    }

    createSetVaultInstruction(
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feePercentage: number
    ): TransactionInstruction {

        let ctx: any = {
            accounts: {
                feeVault: feeVaultAddress,
                createVaultData: feeVaultDataAddress,
                owner: feeReceiverAddress,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY
            },
            signers: [feeReceiverAddress],
            instructions: []
        };

        // calculate Fee percentage here.
        // Fee Percentage must have atmost 2 digits after decimal. 
        // Eg. 0.25% is acceptable but 0.255% is not ?????? DISCUSS IT WITH THE TEAM, TODO
        const calculatedFeePercentage = new BN(feePercentage * 100);

        const createSetVaultIx = this._program.instruction.createFeeAccount(
            calculatedFeePercentage,
            ctx
        );

        return createSetVaultIx
    }

    createRetrieveSolFeesInstruction(
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY
            }
        };

        const ix = this._program.instruction.withdrawFeesSol(ctx);

        return ix
    }

    createRetrieveTokenFeesInstruction(
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        tokenMintAddress: PublicKey,
        feeVaultTokenAccount: PublicKey,
        feeOwnerTokenAccount: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                feeReceiverVaultTokenAccount: feeVaultTokenAccount,
                feeOwnerTokenAccount: feeOwnerTokenAccount
            },
            signers: [feeReceiverAddress],
            instructions: []
        }

        const ix = this._program.instruction.withdrawFeesToken(ctx);

        return ix
    }

    createDepositSolToZebecWalletInstruction(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        amount: number
    ): TransactionInstruction {

        const amountBN = new BN(amount);

        const ctx: any = {
            accounts: {
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                systemProgram: SystemProgram.programId
            },
            signers: [senderAddress],
            instructions: []
        };

        // synchronous `instruction` method, @depricated
        const depositSolIx = this._program.instruction.depositSol(amountBN, ctx);

        // asynchronous `methods` (alternative)

        return depositSolIx
    }

    createDepositTokenToZebecWalletInstruction(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        tokenMintAddress: PublicKey,
        senderAssociatedTokenAddress: PublicKey,
        zebecVaultAssociatedAccountAddress: PublicKey,
        amount: number
    ): TransactionInstruction {
        const amountBN = new BN(amount);

        const ctx: any = {
            accounts: {
                zebecVault: zebecVaultAddress,
                sourceAccount: senderAddress,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                sourceAccountTokenAccount: senderAssociatedTokenAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress
            }
        }

        const ix = this._program.instruction.depositToken(amount, ctx);

        return ix
    }

    createWithdrawSolFromZebecVaultInstruction(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        amount: number
    ): TransactionInstruction {
        const amountBN = new BN(amount);

        const ctx: any = {
            accounts: {
                zebecVault: zebecVaultAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: SystemProgram.programId,
                sender: senderAddress
            },
            signers: [senderAddress]
        };

        const ix = this._program.instruction.initializerNativeWithdrawal(amountBN, ctx);

        return ix
    }

    createWithdrawTokenFromZebecVaultInstruction(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        senderAssociatedTokenAddress: PublicKey,
        escrowAssociatedTokenAddress: PublicKey,
        amount: number
    ): TransactionInstruction {
        const amountBN = new BN(amount);

        const ctx: any = {
            accounts: {
                zebecVault: zebecVaultAddress,
                wtihdrawData: withdrawEscrowDataAccountAddress,
                sourceAccount: senderAddress,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                sourceAccountTokenAccount: senderAssociatedTokenAddress,
                pdaAccountTokenAccount: escrowAssociatedTokenAddress
            },
            signers: [senderAddress],
            instructions: []
        };

        const ix = this._program.instruction.tokenWithdrawal(amount, ctx);

        return ix

    }

    // Native Stream
    createStreamInitSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountKeypair: Keypair,
        withdrawEscrowDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        startTime: number,
        endTime: number,
        amount: number,
    ): TransactionInstruction {

        const dataSize = 8+8+8+8+8+32+32+8+8+32+200+400+200; // WHY???? HOW???
        
        const ctx: any = {
            accounts: {
                dataAccount: escrowAccountKeypair.publicKey,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: SystemProgram.programId,
                sender: senderAddress,
                receiver: receiverAddress
            },
            instructions: [
                this._program.account.stream.createInstruction(
                    escrowAccountKeypair,
                    dataSize
                )
            ],
            signers: [senderAddress, escrowAccountKeypair]
        };

        const startTimeBN = new BN(startTime);
        const endTimeBN = new BN(endTime);
        const amountBN = new BN(amount);

        const streamSolIx = this._program.instruction.nativeStream(startTimeBN, endTimeBN, amountBN, ctx);
        // methods.nativeStream(
        //     startTimeBN,
        //     endTimeBN,
        //     amountBN
        // ).instruction();

        return streamSolIx
    }

    createStreamWithdrawSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        escrowAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
    ): TransactionInstruction {

        const ctx: any = {
            accounts: {
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress,
                feeOwner: feeReceiverAddress,
                feeVaultDataAddress: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: SystemProgram.programId
            },
            signers: [receiverAddress]
        };

        const withdrawSolIx = this._program.instruction.withdrawStream(ctx);

        return withdrawSolIx
    }

    createStreamCancelSolInstruction(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowDataAccountAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowDataAccountAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: SystemProgram.programId
            },
            signers: [senderAddress]
        }

        const ix = this._program.instruction.cancelStream(ctx);

        return ix
    }

    createStreamPauseSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress],
            instructions: []
        };

        const ix = this._program.instruction.pauseStream(ctx);

        return ix
    }

    createStreamResumeSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress]
        };

        const ix = this._program.instruction.resumeStream(ctx);

        return ix
    }

    // Token Stream
    createStreamInitTokenInstruction(
        escrowAccountKeypair: Keypair,
        withdrawEscrowDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        tokenMintAddress: PublicKey,
        startTime: number,
        endTime: number,
        amount: number,
        withdrawLimit: number
    ): TransactionInstruction {

        const ctx: any = {
            accounts: {
                dataAccount: escrowAccountKeypair.publicKey,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                sourceAccount: senderAddress,
                destAccount: receiverAddress,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                mint: tokenMintAddress,
                rent: SYSVAR_RENT_PUBKEY
            },
            signers: [senderAddress, escrowAccountKeypair],
            instructions: []
        };

        const startTimeBN = new BN(startTime);
        const endTimeBN = new BN(endTime);
        const amountBN = new BN(amount);
        const withdrawLimitBN = new BN(withdrawLimit);

        const tokenStreamIx = this._program.instruction.tokenStream(
            startTimeBN,
            endTimeBN,
            amountBN,
            withdrawLimitBN,
            ctx
        );

        // const ix = this._program.methods.tokenStream(startTimeBN, endTimeBN, amountBN, withdrawLimitBN, ctx).instruction()

        return tokenStreamIx
    }

    createStreamWithdrawTokenInstruction(
        receiverAddress: PublicKey,
        senderAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feevaultAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        escrowAccountAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        zebecVaultAssociatedAccountAddress: PublicKey,
        receiverAssociatedTokenAddress: PublicKey,
        feeReceiverAssociatedTokenAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                destAccount: receiverAddress,
                sourceAccount: senderAddress,
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feevaultAddress,
                zebecVault: zebecVaultAddress,
                dataAccount: escrowAccountAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress,
                destTokenAccount: receiverAssociatedTokenAddress,
                feeReceiverAssociatedTokenAddress: feeReceiverAssociatedTokenAddress
            },
            signers: [receiverAddress]
        }
        const ix = this._program.instruction.withdrawTokenStream(ctx);

        return ix
    }

    createStreamCancelTokenInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        escrowAccountAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        escrowAssociatedTokenAddress: PublicKey,
        receiverAssociatedTokenAddress: PublicKey,
        feeReceiverAssociatedTokenAddress: PublicKey
    ): TransactionInstruction{
        const ctx: any = {
            accounts: {
                destAccount: receiverAddress,
                sourceAccount: senderAddress,
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                zebecVault: zebecVaultAddress,
                dataAccount: escrowAccountAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                pdaAccountTokenAccount: escrowAssociatedTokenAddress,
                destTokenAccount: receiverAssociatedTokenAddress,
                feeReceiverTokenAccount: feeReceiverAssociatedTokenAddress
            },
            signers: [senderAddress]
        };

        const ix = this._program.instruction.cancelTokenStream(ctx);

        return ix

    }
    
    createStreamPauseTokenInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress]
        };

        const ix = this._program.instruction.pauseResumeTokenStream(ctx);

        return ix
    }
    
    createStreamResumeTokenInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): TransactionInstruction {
        const ctx: any = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress]
        };

        const ix = this._program.instruction.pauseResumeTokenStream(ctx);

        return ix
    }

    // instant transfers SOL/TOKEN
}

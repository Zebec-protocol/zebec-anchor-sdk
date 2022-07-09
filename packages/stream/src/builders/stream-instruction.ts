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
 * [here](https://github.com/Zebec-protocol/sdk-anchor).
 */
export class ZebecInstructionBuilder {

    readonly _program: Program;

    public constructor(program: Program) {
        this._program = program;
    }

    async createSetVaultInstruction(
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feePercentage: number
    ): Promise<TransactionInstruction> {

        let ctx: any = {
            accounts: {
                feeVault: feeVaultAddress,
                createVaultData: feeVaultDataAddress,
                owner: feeReceiverAddress,
                SystemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY
            },
            signers: [feeReceiverAddress],
            instructions: []
        };

        // calculate Fee percentage here.
        // Fee Percentage must have atmost 2 digits after decimal. 
        // Eg. 0.25% is acceptable but 0.255% is not ?????? DISCUSS IT WITH THE TEAM, TODO
        const calculatedFeePercentage = new BN(feePercentage * 100);

        const createSetVaultIx = await this._program.methods.createVault(
            calculatedFeePercentage,
            ctx
        ).instruction();

        return createSetVaultIx
    }

    async createRetrieveSolFeesInstruction(
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
            accounts: {
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY
            }
        };

        const ix = await this._program.methods.withdrawFeesSol(ctx).instruction()

        return ix
    }

    async createRetrieveTokenFeesInstruction(
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        tokenMintAddress: PublicKey,
        feeVaultTokenAccount: PublicKey,
        feeOwnerTokenAccount: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
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

        const ix = await this._program.methods.withdrawFeesToken(ctx).instruction()

        return ix
    }

    async createDepositSolToZebecWalletInstruction(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        amount: number
    ): Promise<TransactionInstruction> {

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

        const depositSolIx = await this._program.methods.depositSol(amountBN, ctx).instruction();

        return depositSolIx
    }

    async createDepositTokenToZebecWalletInstruction(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        tokenMintAddress: PublicKey,
        senderAssociatedTokenAddress: PublicKey,
        zebecVaultAssociatedAccountAddress: PublicKey,
        amount: number
    ): Promise<TransactionInstruction> {
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

        const ix = await this._program.methods.depositToken(amount, ctx).instruction();

        return ix
    }

    async createWithdrawSolFromZebecVaultInstruction(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        amount: number
    ): Promise<TransactionInstruction>{
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

        const ix = await this._program.methods.initializerNativeWithdrawal(amountBN, ctx).instruction();

        return ix
    }

    async createWithdrawTokenFromZebecVaultInstruction(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        senderAssociatedTokenAddress: PublicKey,
        escrowAssociatedTokenAddress: PublicKey,
        amount: number
    ): Promise<TransactionInstruction>{
        const amountBN = new BN(amount);

        const ctx = {
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

        const ix = await this._program.methods.tokenWithdrawal(amount, ctx).instruction();

        return ix

    }

    // Native Stream
    async createStreamInitSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountKeypair: Keypair,
        withdrawEscrowDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        startTime: number,
        endTime: number,
        amount: number,
    ): Promise<TransactionInstruction> {

        const dataSize = 8+8+8+8+8+32+32+8+8+32+200; // WHY???? HOW???
        
        const ctx: any = {
            accounts: {
                dataAccount: escrowAccountKeypair,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                createVaultData: feeVaultAddress,
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

        const streamSolIx = await this._program.methods.nativeStream(
            startTimeBN,
            endTimeBN,
            amountBN,
            ctx
        ).instruction();

        return streamSolIx
    }

    async createStreamWithdrawSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        escrowAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
    ): Promise<TransactionInstruction> {

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

        const withdrawSolIx = await this._program.methods.withdrawStream(ctx).instruction();

        return withdrawSolIx
    }

    async createStreamCancelSolInstruction(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowDataAccountAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
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
            singers: [senderAddress]
        }

        const ix = await this._program.methods.cancelStream(ctx).instruction();

        return ix
    }

    async createStreamPauseSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress],
            instructions: []
        };

        const ix = await this._program.methods.pauseStream(ctx).instruction();

        return ix
    }

    async createStreamResumeSolInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress],
            instructions: []
        };

        const ix = await this._program.methods.resumeStream(ctx).instruction();

        return ix
    }

    // Token Stream
    async createStreamInitTokenInstruction(
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
    ): Promise<TransactionInstruction> {

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

        const tokenStreamIx = this._program.methods.tokenStream(
            startTimeBN,
            endTimeBN,
            amountBN,
            withdrawLimitBN,
            ctx
        ).instruction();

        // const ix = this._program.methods.tokenStream(startTimeBN, endTimeBN, amountBN, withdrawLimitBN, ctx).instruction()

        return tokenStreamIx
    }

    async createStreamWithdrawTokenInstruction(
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
    ): Promise<TransactionInstruction> {
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
        const ix = this._program.methods.withdrawTokenStream(ctx).instruction();

        return ix
    }

    async createStreamCancelTokenInstruction(
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
    ): Promise<TransactionInstruction>{
        const ctx = {
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

        const ix = await this._program.methods.cancelTokenStream(ctx).instruction();

        return ix

    }
    
    async createStreamPauseTokenInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress],
            instructions: []
        };

        const ix = await this._program.methods.pauseResumeTokenStream(ctx).instruction();

        return ix
    }
    
    async createStreamResumeTokenInstruction(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const ctx = {
            accounts: {
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            },
            signers: [senderAddress],
            instructions: []
        };

        const ix = await this._program.methods.pauseResumeTokenStream(ctx).instruction();

        return ix
    }

    // instant transfers SOL/TOKEN
}

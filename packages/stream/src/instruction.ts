import { BN, Program } from "@project-serum/anchor";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { 
    Keypair, PublicKey, SystemProgram, 
    SYSVAR_RENT_PUBKEY, TransactionSignature 
} from "@solana/web3.js";

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
 * [here](https://github.com/Zebec-protocol/zebec-anchor-sdk/blob/master/packages/stream/src/instruction.ts).
 */
export class ZebecTransactionBuilder {

    readonly _program: Program;

    public constructor(program: Program) {
        this._program = program;
    }

    async execFeeVault(
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feePercentage: number
    ): Promise<TransactionSignature> {

        // calculate Fee percentage here.
        // Fee Percentage must have atmost 2 digits after decimal. 
        // Eg. 0.25% is acceptable but 0.255% is not ?????? DISCUSS IT WITH THE TEAM, TODO
        const calculatedFeePercentage = new BN(feePercentage * 100);

        const signature = await this._program.methods.createFeeAccount(
            calculatedFeePercentage
        ).accounts({
            owner: feeReceiverAddress,
            feeVault: feeVaultAddress,
            createVaultData: feeVaultDataAddress,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        }).rpc();

        return signature
    }

    async execRetrieveSolFees(
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.withdrawFeesSol().accounts({
            feeOwner: feeReceiverAddress,
            createVaultData: feeVaultDataAddress,
            feeVault: feeVaultAddress,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        }).rpc();

        return signature
    }

    async execRetrieveTokenFees(
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        tokenMintAddress: PublicKey,
        feeVaultTokenAccount: PublicKey,
        feeOwnerTokenAccount: PublicKey
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.withdrawFeesToken().accounts({
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
        }).rpc();

        return signature
    }

    async execDepositSolToZebecWallet(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        amount: number
    ): Promise<TransactionSignature> {

        const amountBN = new BN(amount);

        const signature = await this._program.methods.depositSol(amountBN).accounts({
            zebecVault: zebecVaultAddress,
            sender: senderAddress,
            systemProgram: SystemProgram.programId
        }).rpc();

        return signature
    }

    async execDepositTokenToZebecWallet(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        tokenMintAddress: PublicKey,
        senderAssociatedTokenAddress: PublicKey,
        zebecVaultAssociatedAccountAddress: PublicKey,
        amount: number
    ): Promise<TransactionSignature> {
        const amountBN = new BN(amount);

        const signature = await this._program.methods.depositToken(amountBN).accounts({
            zebecVault: zebecVaultAddress,
            sourceAccount: senderAddress,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            mint: tokenMintAddress,
            sourceAccountTokenAccount: senderAssociatedTokenAddress,
            pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress
        }).rpc();

        return signature
    }

    async execWithdrawSolFromZebecVault(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        amount: number
    ): Promise<TransactionSignature> {
        const amountBN = new BN(amount);

        const signature = await this._program.methods.initializerNativeWithdrawal(amountBN).accounts({
            zebecVault: zebecVaultAddress,
            withdrawData: withdrawEscrowDataAccountAddress,
            systemProgram: SystemProgram.programId,
            sender: senderAddress
        }).rpc();

        return signature
    }

    async execWithdrawTokenFromZebecVault(
        senderAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        senderAssociatedTokenAddress: PublicKey,
        escrowAssociatedTokenAddress: PublicKey,
        amount: number
    ): Promise<TransactionSignature> {
        const amountBN = new BN(amount);

        const signature = await this._program.methods.tokenWithdrawal(amount).accounts({
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
        }).rpc();

        return signature

    }

    async execStreamInitSol(
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
    ): Promise<string> {

        const dataSize = 8+8+8+8+8+32+32+8+8+32+200; // WHY???? HOW???
        
        const createAccountIx = await this._program.account.stream.createInstruction(
            escrowAccountKeypair,
            dataSize
        );

        const startTimeBN = new BN(startTime);
        const endTimeBN = new BN(endTime);
        const amountBN = new BN(amount);

        const signature = this._program.methods.nativeStream(startTimeBN, endTimeBN, amountBN)
        .accounts({
            dataAccount: escrowAccountKeypair.publicKey,
            withdrawData: withdrawEscrowDataAccountAddress,
            feeOwner: feeReceiverAddress,
            createVaultData: feeVaultDataAddress,
            feeVault: feeVaultAddress,
            systemProgram: SystemProgram.programId,
            sender: senderAddress,
            receiver: receiverAddress
        }).preInstructions([createAccountIx]).signers([escrowAccountKeypair]).rpc();

        return signature
    }

    async execStreamWithdrawSol(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        zebecVaultAddress: PublicKey,
        escrowAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.withdrawStream().accounts({
            zebecVault: zebecVaultAddress,
            sender: senderAddress,
            receiver: receiverAddress,
            dataAccount: escrowAccountAddress,
            feeOwner: feeReceiverAddress,
            feeVaultDataAddress: feeVaultDataAddress,
            feeVault: feeVaultAddress,
            systemProgram: SystemProgram.programId
        }).rpc();

        return signature
    }

    async execStreamCancelSol(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowDataAccountAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): Promise<TransactionSignature> {
        
        const signature = await this._program.methods.cancelStream().accounts({
            zebecVault: zebecVaultAddress,
            sender: senderAddress,
            receiver: receiverAddress,
            dataAccount: escrowDataAccountAddress,
            withdrawData: withdrawEscrowDataAccountAddress,
            feeOwner: feeReceiverAddress,
            createVaultData: feeVaultDataAddress,
            feeVault: feeVaultAddress,
            systemProgram: SystemProgram.programId
        }).rpc();

        return signature
    }

    async execStreamPauseSol(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.pauseStream().accounts({
            sender: senderAddress,
            receiver: receiverAddress,
            dataAccount: escrowAccountAddress
        }).rpc();

        return signature
    }

    async execStreamResumeSol(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.pauseStream().accounts({
            sender: senderAddress,
            receiver: receiverAddress,
            dataAccount: escrowAccountAddress
        }).rpc();

        return signature
    }

    async execStreamInitToken(
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
    ): Promise<TransactionSignature> {

        const startTimeBN = new BN(startTime);
        const endTimeBN = new BN(endTime);
        const amountBN = new BN(amount);
        const withdrawLimitBN = new BN(withdrawLimit);

        const signature = await this._program.methods.tokenStream(
            startTimeBN,
            endTimeBN,
            amountBN,
            withdrawLimitBN
        ).accounts({
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
        }).signers([escrowAccountKeypair]).rpc();

        return signature
    }

    async execStreamWithdrawToken(
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
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.withdrawTokenStream().accounts({
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
        }).rpc();

        return signature
    }

    async execStreamCancelToken(
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
    ): Promise<TransactionSignature>{

        const signature = await this._program.methods.cancelTokenStream().accounts({
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
        }).rpc();

        return signature

    }
    
    async execStreamPauseToken(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionSignature> {

        const signature = await this._program.methods.pauseResumeTokenStream().accounts({
            sender: senderAddress,
            receiver: receiverAddress,
            dataAccount: escrowAccountAddress
        }).rpc();

        return signature
    }
    
    async execStreamResumeToken(
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        escrowAccountAddress: PublicKey
    ): Promise<TransactionSignature> {
        
        const signature = await this._program.methods.pauseResumeTokenStream().accounts({
            sender: senderAddress,
            receiver: receiverAddress,
            dataAccount: escrowAccountAddress
        }).rpc();

        return signature
    }

    // instant transfers SOL/TOKEN
}

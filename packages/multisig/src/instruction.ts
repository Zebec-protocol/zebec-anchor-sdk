import { BN, Program, web3 } from "@project-serum/anchor";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { AccountMeta, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { ZEBEC_STREAM } from "./config";
import { getTxSize } from "./services";
import { AccountKeys } from "./services/accounts";

// Test code Mappings
// multisig: MultisigDataAccount
// multisigSigner: MultisigSafeAccount
// transaction: zebecTransactionDataAccount

export class ZebecTransactionBuilder {
    readonly _multisigProgram: Program;
    readonly _streamProgram: Program;

    constructor(multisigProgram: Program, streamProgram: Program) {
        this._multisigProgram = multisigProgram;
        this._streamProgram = streamProgram;
    }

    async execApproveTransaction(
        multisigSafeAddress: PublicKey,
        zebecAccountAndDataStoringTxAccount: PublicKey,
        senderAddress: PublicKey
    ): Promise<Transaction> {

        const tx = await this._multisigProgram.methods.approve().accounts({
            multisig: multisigSafeAddress,
            transaction: zebecAccountAndDataStoringTxAccount,
            owner: senderAddress
        }).transaction();

        return tx;
    }

    async execTransaction(
        safeAddress: PublicKey,
        safeDataAccount: PublicKey,
        zebecTxAccount: PublicKey,
        remainingAccounts: AccountMeta[]
    ): Promise<any> {

        console.log('safeAddress', safeAddress.toString());
        console.log('safeDataAccount', safeDataAccount.toString());
        console.log('zebecTxAccount', zebecTxAccount.toString());
        console.log('remainingAccounts', remainingAccounts);

        const tx = await this._multisigProgram.methods.executeTransaction().accounts({
            multisig: safeDataAccount,
            multisigSigner: safeAddress,
            transaction: zebecTxAccount
        }).remainingAccounts(remainingAccounts).transaction();

        return tx;
    }

    async execCreateSafe(
        multisigDataAccount: Keypair,
        multisigSafeNonce: number,
        owners: PublicKey[],
        threshold: number
    ): Promise<Transaction> {

        const multisigAccountSize = 200;
        const thresholdBN = new BN(threshold);

        const preIx = await this._multisigProgram.account.multisig.createInstruction(
            multisigDataAccount,
            multisigAccountSize
        );

        const tx = await this._multisigProgram.methods.createMultisig(
            owners, thresholdBN, multisigSafeNonce
        ).accounts({
            multisig: multisigDataAccount.publicKey
        }).preInstructions([preIx]).signers([multisigDataAccount]).transaction();

        return tx;
    }

    async execFeeVault(
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feePercentage: number
    ): Promise<Transaction> {

        const calculatedFeePercentage = new BN(feePercentage * 100);

        const tx = await this._streamProgram.methods.createFeeAccount(
            calculatedFeePercentage
        ).accounts({
            owner: feeReceiverAddress,
            feeVault: feeVaultAddress,
            vaultData: feeVaultDataAddress,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        }).transaction();

        return tx;
    }

    async execDepositSol(
        zebecVaultAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        amount: number
    ): Promise<Transaction> {
        const amountBN = new BN(amount);

        const tx = await this._streamProgram.methods.instantNativeTransfer(
            amountBN
        ).accounts({
            zebecVault: zebecVaultAddress,
            sender: senderAddress,
            receiver: receiverAddress,
            withdrawData: withdrawEscrowDataAccountAddress,
            systemProgram: SystemProgram.programId
        }).transaction();

        return tx;
    }

    async execDepositToken(
        zebecVaultAddress: PublicKey,
        receiverAddress: PublicKey,
        senderAddress: PublicKey,
        withdrawEscrowDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        zebecVaultAssociatedTokenAddress: PublicKey,
        receiverAssociatedTokenAddress: PublicKey,
        amount: number
    ): Promise<Transaction> {

        const amountBN = new BN(amount);

        const tx = await this._streamProgram.methods.instantTokenTransfer(
            amountBN
        ).accounts({
            zebecVault: zebecVaultAddress,
            destAccount: receiverAddress,
            sourceAccount: senderAddress,
            withdrawData: withdrawEscrowDataAccountAddress,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            mint: tokenMintAddress,
            pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
            destTokenAccount: receiverAssociatedTokenAddress
        }).transaction();

        return tx;
    }

    async execDepositToVault(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        safeDataAccount: PublicKey,
        zebecTransactionAccount: Keypair,
        senderAddress: PublicKey,
        amount: number,
    ): Promise<Transaction> {

        const amountBN = new BN(amount);

        const txAccountSize = 1000;

        const zebecDepositAccounts = AccountKeys.deposit(
            zebecVaultAddress,
            safeAddress,
        );

        const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.DEPOSIT_SOL, {
                amount: amountBN,
            }
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecDepositAccounts,
            pauseSolIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;

    }



    async execInitStream(
        safeAddress: PublicKey,
        safeDataAccount: PublicKey,
        zebecTransactionAccount: Keypair,
        streamDataAccountAddress: Keypair,
        withdrawDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        startTime: number,
        endTime: number,
        amount: number
    ): Promise<Transaction> {

        const startTimeBN = new BN(startTime);
        const endTimeBN = new BN(endTime);
        const amountBN = new BN(amount);
        const canCancel = true;
        const canUpdate = true;

        const txAccountSize = 1000;
        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200;

        const zebecInitStreamAccounts = AccountKeys.init(
            streamDataAccountAddress.publicKey,
            withdrawDataAccountAddress,
            feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            safeAddress,
            receiverAddress
        );

        console.log(zebecInitStreamAccounts, "hhhh")

        const streamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.INIT_STREAM_SOL,
            {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
                canCancel,
                canUpdate
            }
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const createStreamEscrowAccountIx = await this._streamProgram.account.stream.createInstruction(
            streamDataAccountAddress,
            streamEscrowAccountDataSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecInitStreamAccounts,
            streamSolIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([
            createStreamEscrowAccountIx, createTxDataStoringAccountIx
        ]).signers([streamDataAccountAddress, zebecTransactionAccount]).transaction();

        return tx;
    }

    async execPauseStream(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey
    ): Promise<Transaction> {

        const txAccountSize = 1000;

        const zebecPauseStreamAccounts = AccountKeys.pause(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress
        );

        const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.PAUSE_STREAM_SOL, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecPauseStreamAccounts,
            pauseSolIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;

    }

    async execResumeStream(
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey
    ): Promise<Transaction> {

        const txAccountSize = 1000;
        const zebecResumeStreamAccounts = AccountKeys.resume(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress
        );

        const resumeSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.RESUME_STREAM_SOL, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecResumeStreamAccounts,
            resumeSolIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }

    async execCancelStream(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey
    ): Promise<Transaction> {

        const txAccountSize = 1000;
        const zebecCancelStreamAccounts = AccountKeys.cancel(
            zebecVaultAddress,
            safeAddress,
            receiverAddress,
            streamDataAccountAddress,
            withdrawDataAccountAddress,
            feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress
        );

        const cancelSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.CANCEL_STREAM_SOL, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecCancelStreamAccounts,
            cancelSolIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }

    async execInstantStream(
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
    ): Promise<Transaction> {

        const txAccountSize = 1000;
        const zebecCancelStreamAccounts = AccountKeys.instanttransfer(
            zebecVaultAddress,
            safeAddress,
            receiverAddress,
            withdrawDataAccountAddress,
        );

        const cancelSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.INSTANT_TRANSFER_SOL, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecCancelStreamAccounts,
            cancelSolIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }

    async execStreamInitToken(
        owners: PublicKey[],
        safeAddress: PublicKey,
        safeDataAccount: PublicKey,
        zebecTransactionAccount: Keypair,
        streamDataAccountAddress: Keypair,
        withdrawDataAccount: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        senderAddress: PublicKey,
        receiverAddress: PublicKey,
        tokenMintAddress: PublicKey,
        startTime: number,
        endTime: number,
        amount: number
    ): Promise<Transaction> {

        const startTimeBN = new BN(startTime);
        const endTimeBN = new BN(endTime);
        const amountBN = new BN(amount);
        const canCancel = true;
        const canUpdate = true;

        const zebecInitStreamAccounts = AccountKeys.inittoken(
            streamDataAccountAddress.publicKey,
            withdrawDataAccount,    
            feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            safeAddress,
            receiverAddress,
            tokenMintAddress
        );

        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200;

        const txAccountSize = getTxSize(zebecInitStreamAccounts,owners,true,streamEscrowAccountDataSize);

        console.log(txAccountSize);

        console.log(zebecInitStreamAccounts, "hhhh")

        const streamTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.INIT_STREAM_TOKEN,
            {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
                canCancel,
                canUpdate
            }
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const createStreamEscrowAccountIx = await this._streamProgram.account.streamToken.createInstruction(
            streamDataAccountAddress,
            streamEscrowAccountDataSize
        );

        console.log(createStreamEscrowAccountIx, "createStreamEscrowAccountIx")
        console.log(createTxDataStoringAccountIx, "createTxDataStoringAccountIx")

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecInitStreamAccounts,
            streamTokenIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([
            createStreamEscrowAccountIx, createTxDataStoringAccountIx
        ]).signers([streamDataAccountAddress, zebecTransactionAccount]).transaction();

        return tx;

    }

    async execStreamPauseToken(
        owners: PublicKey[],
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey
    ): Promise<Transaction> {
    
        const zebecPauseStreamAccounts = AccountKeys.pausetoken(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress
        );

        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200;

        const txAccountSize = getTxSize(zebecPauseStreamAccounts,owners,true,streamEscrowAccountDataSize);
        console.log(txAccountSize);

        const pauseTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecPauseStreamAccounts,
            pauseTokenIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }

    async execStreamResumeToken(
        owners: PublicKey[],
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey
    ): Promise<Transaction> {

        const zebecPauseStreamAccounts = AccountKeys.resumetoken(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress
        );

        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200;

        const txAccountSize = getTxSize(zebecPauseStreamAccounts,owners,true,streamEscrowAccountDataSize);
        console.log(txAccountSize);

        const resumeTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecPauseStreamAccounts,
            resumeTokenIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }

    async execStreamCancelToken(
        owners: PublicKey[],
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamDataAccountAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        feeReceiverAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feeVaultAddress: PublicKey,
        tokenMintAddress: PublicKey,
        pdaTokenData:PublicKey,
        destTokenData:PublicKey,
        feeTokenData:PublicKey,
    ): Promise<Transaction> {

        const zebecCancelStreamAccounts = AccountKeys.canceltoken(
            zebecVaultAddress,
            receiverAddress,
            safeAddress,
            feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            streamDataAccountAddress,
            withdrawDataAccountAddress,
            tokenMintAddress,
            pdaTokenData,
            destTokenData,
            feeTokenData,
        );

        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200;

        const txAccountSize = getTxSize(zebecCancelStreamAccounts,owners,true,streamEscrowAccountDataSize);
        console.log(txAccountSize);

        const cancelTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.CANCEL_STREAM_TOKEN, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecCancelStreamAccounts,
            cancelTokenIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }

    async execInstantStreamToken(
        owners: PublicKey[],
        zebecVaultAddress: PublicKey,
        safeAddress: PublicKey,
        receiverAddress: PublicKey,
        zebecTransactionAccount: Keypair,
        safeDataAccount: PublicKey,
        senderAddress: PublicKey,
        withdrawDataAccountAddress: PublicKey,
        tokenMintAddress: PublicKey,
        pdaTokenData:PublicKey,
        destTokenData:PublicKey,
    ): Promise<Transaction> {

        const zebecInstantStreamAccounts = AccountKeys.instanttransfertoken(
            zebecVaultAddress,
            receiverAddress,
            safeAddress,
            withdrawDataAccountAddress,
            tokenMintAddress,
            pdaTokenData,
            destTokenData,
        );

        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200;

        const txAccountSize = getTxSize(zebecInstantStreamAccounts,owners,true,streamEscrowAccountDataSize);
        console.log(txAccountSize);

        const cancelTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
            ZEBEC_STREAM.INSTANT_TRANSFER_TOKEN, {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecTransactionAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecInstantStreamAccounts,
            cancelTokenIxDataBuffer
        ).accounts({
            multisig: safeDataAccount,
            transaction: zebecTransactionAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();

        return tx;
    }
}
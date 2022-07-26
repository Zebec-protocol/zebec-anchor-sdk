import { BN, Program, web3 } from "@project-serum/anchor";
import { AccountMeta, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";

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
        multisigSafeAddress: PublicKey,
        multisigDataAccount: PublicKey,
        multisigSafeZebecWalletAddress: PublicKey,
        zebecAccountAndDataStoringTxAccount: PublicKey
    ): Promise<any> {

        const zebecDepositSolAccounts = [
            { pubkey: multisigSafeZebecWalletAddress, isSigner: false, isWritable: true },
            { pubkey: multisigSafeAddress, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ];

        const tx = await this._multisigProgram.methods.executeTransaction().accounts({
            multisig: multisigDataAccount,
            multisigSigner: multisigSafeAddress,
            transaction: zebecAccountAndDataStoringTxAccount
        }).remainingAccounts(
            zebecDepositSolAccounts.map((t: any) => {
                if (t.pubkey.equals(multisigSafeAddress)) {
                    return { ...t, isSigner: false };
                }
                console.log(t)
                return t;
              })
              .concat({
                pubkey: this._streamProgram.programId,
                isWritable: false,
                isSigner: false,
              })
        ).transaction();
        console.log(tx, "hello")

        return tx;
    }

    // create safe
    async execCreateSafe(
        multisigDataAccount: Keypair,
        multisigSafeNonce: number,
        owners: PublicKey[],
        threshold: number
    ): Promise<Transaction> {
        // call createMultisig method with (owners, threshold, nonce & context)

        // owners_count:  number of multisig owners OR list of PublicKeys???
        // threshold: number of signers required to confirm the transaction.
        // const { owners_count, threshold } = data;

        const multisigAccountSize = 200;
        const thresholdBN = new BN(threshold);

        const preIx = await this._multisigProgram.account.multisig.createInstruction(
            multisigDataAccount,
            multisigAccountSize
        );

        // const multisigDataAccount = Keypair.generate(); // in test code its `multisig`
        const tx = await this._multisigProgram.methods.createMultisig(
            owners, thresholdBN, multisigSafeNonce
        ).accounts({
            multisig: multisigDataAccount.publicKey
        }).preInstructions([preIx]).signers([multisigDataAccount]).transaction();

        return tx;
    }

    // create fee vault
    async execFeeVault(
        feeReceiverAddress: PublicKey,
        feeVaultAddress: PublicKey,
        feeVaultDataAddress: PublicKey,
        feePercentage: number
    ): Promise<Transaction> {

        // calculate Fee percentage here.
        // Fee Percentage must have atmost 2 digits after decimal. 
        // Eg. 0.25% is acceptable but 0.255% is not ?????? DISCUSS IT WITH THE TEAM, TODO
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

    // Deposit SOL
    async execDepositSol(
        senderAddress: PublicKey,
        multisigSafeAddress: PublicKey,
        multisigDataAccount: PublicKey,
        multisigSafeZebecWalletAddress: PublicKey,
        zebecAccountAndDataStoringTxAccount: Keypair,
        amount: number
    ): Promise<Transaction> {

        const depositAmountBN = new BN(amount);
        const txAccountSize = 1000; // Correct it later

        const depositSolIxBuffer = this._streamProgram.coder.instruction.encode(
            "depositSol",
            { amount: depositAmountBN }
        );

        const zebecDepositSolAccounts = [
            { pubkey: multisigSafeZebecWalletAddress, isSigner: false, isWritable: true },
            { pubkey: multisigSafeAddress, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ];

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecAccountAndDataStoringTxAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecDepositSolAccounts,
            depositSolIxBuffer
        ).accounts({
            multisig: multisigDataAccount,
            transaction: zebecAccountAndDataStoringTxAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecAccountAndDataStoringTxAccount]).transaction();

        // sign this transaction and create signature
        // store the signature
        // approve the transaction with other owners
        // after all the transaction is signed by the owners
        // executeTransaction
        return tx;
    }

    // Init Stream
    async execInitStream(
        multisigSafeAddress: PublicKey,
        multisigDataAccount: Keypair,
        zebecAccountAndDataStoringTxAccount: Keypair,
        streamEscrowAccountAddress: Keypair,
        withdrawEscrowDataAddress: PublicKey,
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

        const txAccountSize = 1000;
        const streamEscrowAccountDataSize = 8+8+8+8+8+32+32+8+8+32+200

        const zebecInitStreamAccounts = [
            { pubkey: streamEscrowAccountAddress.publicKey, isSigner: false, isWritable: true },
            { pubkey: withdrawEscrowDataAddress, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: multisigSafeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ];

        const streamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            "nativeStream",
            {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN
            }
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecAccountAndDataStoringTxAccount,
            txAccountSize
        );

        const createStreamEscrowAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            streamEscrowAccountAddress,
            streamEscrowAccountDataSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecInitStreamAccounts,
            streamSolIxDataBuffer
        ).accounts({
            multisig: multisigDataAccount.publicKey,
            transaction: zebecAccountAndDataStoringTxAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([
            createTxDataStoringAccountIx, createStreamEscrowAccountIx
        ]).signers([zebecAccountAndDataStoringTxAccount, multisigDataAccount]).transaction();

        return tx;
    }

    // Pause Stream
    async execPauseStream(
        multisigSafeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamEscrowAccountAddress: PublicKey,
        zebecAccountAndDataStoringTxAccount: Keypair,
        multisigDataAccount: PublicKey,
        senderAddress: PublicKey
    ): Promise<Transaction> {

        const txAccountSize = 1000;


        const zebecPauseStreamAccounts = [
            { pubkey: multisigSafeAddress, isSigner: true, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamEscrowAccountAddress, isSigner: false, isWritable: true }
        ];

        const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            "pauseStream", {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecAccountAndDataStoringTxAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecPauseStreamAccounts,
            pauseSolIxDataBuffer
        ).accounts({
            multisig: multisigDataAccount,
            transaction: zebecAccountAndDataStoringTxAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecAccountAndDataStoringTxAccount]).transaction();

        return tx;

    }

    // Resume Stream
    async execResumeStream(
        multisigSafeAddress: PublicKey,
        receiverAddress: PublicKey,
        streamEscrowAccountAddress: PublicKey, // data account
        multisigDataAccount: PublicKey,
        zebecAccountAndDataStoringTxAccount: Keypair,
        senderAddress: PublicKey,
    ): Promise<Transaction> {

        const txAccountSize = 1000;
        const zebecResumeStreamAccounts = [
            { pubkey: multisigSafeAddress, isSigner: true, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamEscrowAccountAddress, isSigner: false, isWritable: true }
        ];

        const resumeSolIxDataBuffer = this._streamProgram.coder.instruction.encode(
            "pauseStream", {}
        );

        const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
            zebecAccountAndDataStoringTxAccount,
            txAccountSize
        );

        const tx = await this._multisigProgram.methods.createTransaction(
            this._streamProgram.programId,
            zebecResumeStreamAccounts,
            resumeSolIxDataBuffer
        ).accounts({
            multisig: multisigDataAccount,
            transaction: zebecAccountAndDataStoringTxAccount.publicKey,
            proposer: senderAddress
        }).preInstructions([createTxDataStoringAccountIx]).signers([zebecAccountAndDataStoringTxAccount]).transaction();

        return tx;
    }
    //
}
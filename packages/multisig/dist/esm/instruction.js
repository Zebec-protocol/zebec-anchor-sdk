"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZebecTransactionBuilder = void 0;
const anchor_1 = require("@project-serum/anchor");
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("./config");
const services_1 = require("./services");
const accounts_1 = require("./services/accounts");
class ZebecTransactionBuilder {
    constructor(multisigProgram, streamProgram) {
        this._multisigProgram = multisigProgram;
        this._streamProgram = streamProgram;
    }
    execApproveTransaction(multisigSafeAddress, zebecAccountAndDataStoringTxAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._multisigProgram.methods.approve().accounts({
                multisig: multisigSafeAddress,
                transaction: zebecAccountAndDataStoringTxAccount,
                owner: senderAddress
            }).transaction();
            return tx;
        });
    }
    execTransaction(safeAddress, safeDataAccount, zebecTxAccount, remainingAccounts) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('safeAddress', safeAddress.toString());
            console.log('safeDataAccount', safeDataAccount.toString());
            console.log('zebecTxAccount', zebecTxAccount.toString());
            console.log('remainingAccounts', remainingAccounts);
            const tx = yield this._multisigProgram.methods.executeTransaction().accounts({
                multisig: safeDataAccount,
                multisigSigner: safeAddress,
                transaction: zebecTxAccount
            }).remainingAccounts(remainingAccounts).transaction();
            return tx;
        });
    }
    execCreateSafe(multisigDataAccount, multisigSafeNonce, owners, threshold) {
        return __awaiter(this, void 0, void 0, function* () {
            const multisigAccountSize = 200;
            const thresholdBN = new anchor_1.BN(threshold);
            const preIx = yield this._multisigProgram.account.multisig.createInstruction(multisigDataAccount, multisigAccountSize);
            const tx = yield this._multisigProgram.methods.createMultisig(owners, thresholdBN, multisigSafeNonce).accounts({
                multisig: multisigDataAccount.publicKey
            }).preInstructions([preIx]).signers([multisigDataAccount]).transaction();
            return tx;
        });
    }
    execFeeVault(feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, feePercentage) {
        return __awaiter(this, void 0, void 0, function* () {
            const calculatedFeePercentage = new anchor_1.BN(feePercentage * 100);
            const tx = yield this._streamProgram.methods.createFeeAccount(calculatedFeePercentage).accounts({
                owner: feeReceiverAddress,
                feeVault: feeVaultAddress,
                vaultData: feeVaultDataAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY
            }).transaction();
            return tx;
        });
    }
    execDepositSol(zebecVaultAddress, senderAddress, receiverAddress, withdrawEscrowDataAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = new anchor_1.BN(amount);
            const tx = yield this._streamProgram.methods.instantNativeTransfer(amountBN).accounts({
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId
            }).transaction();
            return tx;
        });
    }
    execDepositToken(zebecVaultAddress, receiverAddress, senderAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, receiverAssociatedTokenAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = new anchor_1.BN(amount);
            const tx = yield this._streamProgram.methods.instantTokenTransfer(amountBN).accounts({
                zebecVault: zebecVaultAddress,
                destAccount: receiverAddress,
                sourceAccount: senderAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
                destTokenAccount: receiverAssociatedTokenAddress
            }).transaction();
            return tx;
        });
    }
    execDepositToVault(zebecVaultAddress, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = new anchor_1.BN(amount);
            const txAccountSize = 1000;
            const zebecDepositAccounts = accounts_1.AccountKeys.deposit(zebecVaultAddress, safeAddress);
            const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.DEPOSIT_SOL, {
                amount: amountBN,
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecDepositAccounts, pauseSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execDepositTokenToVault(zebecVaultAddress, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = new anchor_1.BN(amount);
            const txAccountSize = 1000;
            const zebecDepositAccounts = accounts_1.AccountKeys.depositToken(zebecVaultAddress, safeAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData);
            const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.DEPOSIT_TOKEN, {
                amount: amountBN,
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecDepositAccounts, pauseSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execInitStream(safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccountAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, senderAddress, receiverAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = new anchor_1.BN(amount);
            const canCancel = true;
            const canUpdate = true;
            const txAccountSize = 1000;
            const streamEscrowAccountDataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
            const zebecInitStreamAccounts = accounts_1.AccountKeys.init(streamDataAccountAddress.publicKey, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress);
            console.log(zebecInitStreamAccounts, "hhhh");
            const streamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INIT_STREAM_SOL, {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
                canCancel,
                canUpdate
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const createStreamEscrowAccountIx = yield this._streamProgram.account.stream.createInstruction(streamDataAccountAddress, streamEscrowAccountDataSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([
                createStreamEscrowAccountIx, createTxDataStoringAccountIx
            ]).signers([streamDataAccountAddress, zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execPauseStream(safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const txAccountSize = 1000;
            const zebecPauseStreamAccounts = accounts_1.AccountKeys.pause(safeAddress, receiverAddress, streamDataAccountAddress);
            const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.PAUSE_STREAM_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, pauseSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execResumeStream(safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const txAccountSize = 1000;
            const zebecResumeStreamAccounts = accounts_1.AccountKeys.resume(safeAddress, receiverAddress, streamDataAccountAddress);
            const resumeSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.RESUME_STREAM_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecResumeStreamAccounts, resumeSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execCancelStream(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const txAccountSize = 1000;
            const zebecCancelStreamAccounts = accounts_1.AccountKeys.cancel(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress);
            const cancelSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.CANCEL_STREAM_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execInstantStream(zebecVaultAddress, safeAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const txAccountSize = 1000;
            const zebecCancelStreamAccounts = accounts_1.AccountKeys.instanttransfer(zebecVaultAddress, safeAddress, receiverAddress, withdrawDataAccountAddress);
            const cancelSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INSTANT_TRANSFER_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelSolIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execStreamInitToken(owners, safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccountAddress, withdrawDataAccount, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, senderAddress, receiverAddress, tokenMintAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = new anchor_1.BN(amount);
            const canCancel = true;
            const canUpdate = true;
            const zebecInitStreamAccounts = accounts_1.AccountKeys.inittoken(streamDataAccountAddress.publicKey, withdrawDataAccount, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress, tokenMintAddress);
            const streamEscrowAccountDataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
            const txAccountSize = (0, services_1.getTxSize)(zebecInitStreamAccounts, owners, true, streamEscrowAccountDataSize);
            console.log(txAccountSize);
            console.log(zebecInitStreamAccounts, "hhhh");
            const streamTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INIT_STREAM_TOKEN, {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
                canCancel,
                canUpdate
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const createStreamEscrowAccountIx = yield this._streamProgram.account.streamToken.createInstruction(streamDataAccountAddress, streamEscrowAccountDataSize);
            console.log(createStreamEscrowAccountIx, "createStreamEscrowAccountIx");
            console.log(createTxDataStoringAccountIx, "createTxDataStoringAccountIx");
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamTokenIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([
                createStreamEscrowAccountIx, createTxDataStoringAccountIx
            ]).signers([streamDataAccountAddress, zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execStreamPauseToken(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecPauseStreamAccounts = accounts_1.AccountKeys.pausetoken(safeAddress, receiverAddress, streamDataAccountAddress);
            const streamEscrowAccountDataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
            const txAccountSize = (0, services_1.getTxSize)(zebecPauseStreamAccounts, owners, true, streamEscrowAccountDataSize);
            console.log(txAccountSize);
            const pauseTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, pauseTokenIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execStreamResumeToken(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecPauseStreamAccounts = accounts_1.AccountKeys.resumetoken(safeAddress, receiverAddress, streamDataAccountAddress);
            const streamEscrowAccountDataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
            const txAccountSize = (0, services_1.getTxSize)(zebecPauseStreamAccounts, owners, true, streamEscrowAccountDataSize);
            console.log(txAccountSize);
            const resumeTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, resumeTokenIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execStreamCancelToken(owners, zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, tokenMintAddress, pdaTokenData, destTokenData, feeTokenData) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecCancelStreamAccounts = accounts_1.AccountKeys.canceltoken(zebecVaultAddress, receiverAddress, safeAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, streamDataAccountAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData, feeTokenData);
            const streamEscrowAccountDataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
            const txAccountSize = (0, services_1.getTxSize)(zebecCancelStreamAccounts, owners, true, streamEscrowAccountDataSize);
            console.log(txAccountSize);
            const cancelTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.CANCEL_STREAM_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelTokenIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
    execInstantStreamToken(owners, zebecVaultAddress, safeAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecInstantStreamAccounts = accounts_1.AccountKeys.instanttransfertoken(zebecVaultAddress, receiverAddress, safeAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData);
            const streamEscrowAccountDataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
            const txAccountSize = (0, services_1.getTxSize)(zebecInstantStreamAccounts, owners, true, streamEscrowAccountDataSize);
            console.log(txAccountSize);
            const cancelTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INSTANT_TRANSFER_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods.createTransaction(this._streamProgram.programId, zebecInstantStreamAccounts, cancelTokenIxDataBuffer).accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            }).preInstructions([createTxDataStoringAccountIx]).signers([zebecTransactionAccount]).transaction();
            return tx;
        });
    }
}
exports.ZebecTransactionBuilder = ZebecTransactionBuilder;

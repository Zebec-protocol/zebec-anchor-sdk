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
            const tx = yield this._multisigProgram.methods
                .approve()
                .accounts({
                multisig: multisigSafeAddress,
                transaction: zebecAccountAndDataStoringTxAccount,
                owner: senderAddress
            })
                .transaction();
            return tx;
        });
    }
    execTransaction(safeAddress, safeDataAccount, zebecTxAccount, remainingAccounts) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._multisigProgram.methods
                .executeTransaction()
                .accounts({
                multisig: safeDataAccount,
                multisigSigner: safeAddress,
                transaction: zebecTxAccount
            })
                .remainingAccounts(remainingAccounts)
                .transaction();
            return tx;
        });
    }
    execCreateSafe(multisigDataAccount, multisigSafeNonce, owners, threshold) {
        return __awaiter(this, void 0, void 0, function* () {
            const multisigAccountSize = 200;
            const thresholdBN = new anchor_1.BN(threshold);
            const preIx = yield this._multisigProgram.account.multisig.createInstruction(multisigDataAccount, multisigAccountSize);
            const tx = yield this._multisigProgram.methods
                .createMultisig(owners, thresholdBN, multisigSafeNonce)
                .accounts({
                multisig: multisigDataAccount.publicKey
            })
                .preInstructions([preIx])
                .signers([multisigDataAccount])
                .transaction();
            return tx;
        });
    }
    execFeeVault(feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, feePercentage) {
        return __awaiter(this, void 0, void 0, function* () {
            const calculatedFeePercentage = new anchor_1.BN(feePercentage * 100);
            const tx = yield this._streamProgram.methods
                .createFeeAccount(calculatedFeePercentage)
                .accounts({
                feeOwner: feeReceiverAddress,
                feeVault: feeVaultAddress,
                feeVaultData: feeVaultDataAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY
            })
                .transaction();
            return tx;
        });
    }
    execDepositSol(zebecVaultAddress, senderAddress, receiverAddress, withdrawEscrowDataAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._streamProgram.methods
                .instantNativeTransfer(amountBN)
                .accounts({
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId
            })
                .transaction();
            return tx;
        });
    }
    execDepositToken(zebecVaultAddress, receiverAddress, senderAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, receiverAssociatedTokenAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._streamProgram.methods
                .instantTokenTransfer(amountBN)
                .accounts({
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
            })
                .transaction();
            return tx;
        });
    }
    execDepositToVault(owners, zebecVaultAddress, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const zebecDepositAccounts = accounts_1.AccountKeys.deposit(zebecVaultAddress, safeAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecDepositAccounts, owners, false, 8);
            const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.DEPOSIT_SOL, {
                amount: amountBN
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecDepositAccounts, pauseSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execDepositTokenToVault(owners, zebecVaultAddress, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const zebecDepositAccounts = accounts_1.AccountKeys.depositToken(zebecVaultAddress, safeAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData);
            const txAccountSize = (0, services_1.getTxSize)(zebecDepositAccounts, owners, false, 8);
            const depositSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.DEPOSIT_TOKEN, {
                amount: amountBN
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecDepositAccounts, depositSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execInitStream(owners, safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccountAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, senderAddress, receiverAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const canCancel = true;
            const canUpdate = true;
            const streamEscrowAccountDataSize = config_1.STREAM_SIZE;
            const zebecInitStreamAccounts = accounts_1.AccountKeys.init(streamDataAccountAddress.publicKey, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecInitStreamAccounts, owners, false, 8 * 3 + 1 * 2);
            const streamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INIT_STREAM_SOL, {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
                canCancel,
                canUpdate
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const createStreamEscrowAccountIx = yield this._streamProgram.account.stream.createInstruction(streamDataAccountAddress, streamEscrowAccountDataSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createStreamEscrowAccountIx, createTxDataStoringAccountIx])
                .signers([streamDataAccountAddress, zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execUpdateStream(owners, safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccountAddress, withdrawDataAccountAddress, senderAddress, receiverAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const zebecInitStreamAccounts = accounts_1.AccountKeys.updateinit(streamDataAccountAddress, withdrawDataAccountAddress, safeAddress, receiverAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecInitStreamAccounts, owners, false, 8 * 3);
            const streamSolIxUpdateDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.UPDATE_STREAM_SOL, {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamSolIxUpdateDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execPauseStream(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecPauseStreamAccounts = accounts_1.AccountKeys.pause(safeAddress, receiverAddress, streamDataAccountAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecPauseStreamAccounts, owners, false, 0);
            const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.PAUSE_STREAM_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, pauseSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execResumeStream(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecResumeStreamAccounts = accounts_1.AccountKeys.resume(safeAddress, receiverAddress, streamDataAccountAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecResumeStreamAccounts, owners, false, 0);
            const resumeSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.RESUME_STREAM_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecResumeStreamAccounts, resumeSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execCancelStream(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const txAccountSize = 1000;
            const zebecCancelStreamAccounts = accounts_1.AccountKeys.cancel(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress);
            const cancelSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.CANCEL_STREAM_SOL, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execStreamWithdrawSol(senderAddress, receiverAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._streamProgram.methods
                .withdrawStream()
                .accounts({
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: web3_js_1.SystemProgram.programId
            })
                .transaction();
            return tx;
        });
    }
    execInstantStream(owners, zebecVaultAddress, safeAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, amountInLamports) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecCancelStreamAccounts = accounts_1.AccountKeys.instanttransfer(zebecVaultAddress, safeAddress, receiverAddress, withdrawDataAccountAddress);
            const amountBN = new anchor_1.BN(amountInLamports);
            const txAccountSize = (0, services_1.getTxSize)(zebecCancelStreamAccounts, owners, false, 8);
            const instantStreamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INSTANT_TRANSFER_SOL, {
                amount: amountBN
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, instantStreamSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execTransfer(owners, senderAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, safeAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecInstantTransferAccounts = accounts_1.AccountKeys.transferfromsafe(safeAddress, receiverAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecInstantTransferAccounts, owners, false, 8);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const transferSolIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.DIRECT_TRANSFER_SOL, {
                amount: amountBN
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecInstantTransferAccounts, transferSolIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execTransferToken(owners, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, receiverAddress, destTokenAddress, sourceTokenAddress, tokenMintAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecInstantTransferAccounts = accounts_1.AccountKeys.transfertokenfromsafe(safeAddress, receiverAddress, tokenMintAddress, destTokenAddress, sourceTokenAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecInstantTransferAccounts, owners, false, 8);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const transferTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.DIRECT_TRANSFER_TOKEN, {
                amount: amountBN
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecInstantTransferAccounts, transferTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execUpdateStreamToken(owners, safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccountAddress, withdrawDataAccount, senderAddress, receiverAddress, tokenMintAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const zebecUpdateInitStreamAccounts = accounts_1.AccountKeys.updateinittoken(streamDataAccountAddress, withdrawDataAccount, safeAddress, receiverAddress, tokenMintAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecUpdateInitStreamAccounts, owners, true, 8 * 3);
            const updateStreamTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.UPDATE_STREAM_TOKEN, {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
            });
            const createUpdateTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecUpdateInitStreamAccounts, updateStreamTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createUpdateTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execStreamInitToken(owners, safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccountAddress, withdrawDataAccount, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, senderAddress, receiverAddress, tokenMintAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const canCancel = true;
            const canUpdate = true;
            const zebecInitStreamAccounts = accounts_1.AccountKeys.inittoken(streamDataAccountAddress.publicKey, withdrawDataAccount, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress, tokenMintAddress);
            const streamEscrowAccountDataSize = config_1.STREAM_TOKEN_SIZE;
            const txAccountSize = (0, services_1.getTxSize)(zebecInitStreamAccounts, owners, true, 8 * 3 + 1 * 2);
            const streamTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INIT_STREAM_TOKEN, {
                startTime: startTimeBN,
                endTime: endTimeBN,
                amount: amountBN,
                canCancel,
                canUpdate
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const createStreamEscrowAccountIx = yield this._streamProgram.account.streamToken.createInstruction(streamDataAccountAddress, streamEscrowAccountDataSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createStreamEscrowAccountIx, createTxDataStoringAccountIx])
                .signers([streamDataAccountAddress, zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execStreamPauseToken(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecPauseStreamAccounts = accounts_1.AccountKeys.pausetoken(safeAddress, receiverAddress, streamDataAccountAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecPauseStreamAccounts, owners, false, 0);
            const pauseTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, pauseTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execStreamResumeToken(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecResumeStreamAccounts = accounts_1.AccountKeys.resumetoken(safeAddress, receiverAddress, streamDataAccountAddress);
            const txAccountSize = (0, services_1.getTxSize)(zebecResumeStreamAccounts, owners, false, 0);
            const resumeTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecResumeStreamAccounts, resumeTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execStreamCancelToken(owners, zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, tokenMintAddress, pdaTokenData, destTokenData, feeTokenData) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecCancelStreamAccounts = accounts_1.AccountKeys.canceltoken(zebecVaultAddress, receiverAddress, safeAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, streamDataAccountAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData, feeTokenData);
            const txAccountSize = (0, services_1.getTxSize)(zebecCancelStreamAccounts, owners, false, 0);
            const cancelTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.CANCEL_STREAM_TOKEN, {});
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
    execStreamWithdrawToken(receiverAddress, senderAddress, feeReceiverAddress, feeVaultDataAddress, feevaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedAccountAddress, receiverAssociatedTokenAddress, feeVaultAssociatedTokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._streamProgram.methods
                .withdrawTokenStream()
                .accounts({
                zebecVault: zebecVaultAddress,
                destAccount: receiverAddress,
                sourceAccount: senderAddress,
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feevaultAddress,
                dataAccount: escrowAccountAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress,
                destTokenAccount: receiverAssociatedTokenAddress,
                feeReceiverTokenAccount: feeVaultAssociatedTokenAddress
            })
                .transaction();
            return tx;
        });
    }
    execInstantStreamToken(owners, zebecVaultAddress, safeAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const zebecInstantStreamAccounts = accounts_1.AccountKeys.instanttransfertoken(zebecVaultAddress, receiverAddress, safeAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData);
            const txAccountSize = (0, services_1.getTxSize)(zebecInstantStreamAccounts, owners, false, 8);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const instantTransferTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(config_1.ZEBEC_STREAM.INSTANT_TRANSFER_TOKEN, {
                amount: amountBN
            });
            const createTxDataStoringAccountIx = yield this._multisigProgram.account.transaction.createInstruction(zebecTransactionAccount, txAccountSize);
            const tx = yield this._multisigProgram.methods
                .createTransaction(this._streamProgram.programId, zebecInstantStreamAccounts, instantTransferTokenIxDataBuffer)
                .accounts({
                multisig: safeDataAccount,
                transaction: zebecTransactionAccount.publicKey,
                proposer: senderAddress
            })
                .preInstructions([createTxDataStoringAccountIx])
                .signers([zebecTransactionAccount])
                .transaction();
            return tx;
        });
    }
}
exports.ZebecTransactionBuilder = ZebecTransactionBuilder;

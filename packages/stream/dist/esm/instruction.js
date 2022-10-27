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
class ZebecTransactionBuilder {
    constructor(program) {
        this._program = program;
    }
    execFeeVault(feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, feePercentage) {
        return __awaiter(this, void 0, void 0, function* () {
            const calculatedFeePercentage = new anchor_1.BN(feePercentage * 100);
            const tx = yield this._program.methods
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
    execUpdteFeeVault(feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, feePercentage) {
        return __awaiter(this, void 0, void 0, function* () {
            const calculatedFeePercentage = new anchor_1.BN(feePercentage * 100);
            const tx = yield this._program.methods
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
    execRetrieveSolFees(feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .withdrawFeesSol()
                .accounts({
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY
            })
                .transaction();
            return tx;
        });
    }
    execRetrieveTokenFees(feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, tokenMintAddress, feeVaultTokenAccount, feeOwnerTokenAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .withdrawFeesToken()
                .accounts({
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                feeReceiverVaultTokenAccount: feeVaultTokenAccount,
                feeOwnerTokenAccount: feeOwnerTokenAccount
            })
                .transaction();
            return tx;
        });
    }
    execDepositSolToZebecWallet(senderAddress, zebecVaultAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = new anchor_1.BN(amount);
            const tx = yield this._program.methods
                .depositSol(amountBN)
                .accounts({
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                systemProgram: web3_js_1.SystemProgram.programId
            })
                .transaction();
            return tx;
        });
    }
    execDepositTokenToZebecWallet(zebecVaultAddress, senderAddress, tokenMintAddress, senderAssociatedTokenAddress, zebecVaultAssociatedAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._program.methods
                .depositToken(amountBN)
                .accounts({
                zebecVault: zebecVaultAddress,
                sourceAccount: senderAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                sourceAccountTokenAccount: senderAssociatedTokenAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress
            })
                .transaction();
            return tx;
        });
    }
    execWithdrawSolFromZebecVault(senderAddress, zebecVaultAddress, withdrawEscrowDataAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._program.methods
                .nativeWithdrawal(amountBN)
                .accounts({
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId
            })
                .transaction();
            return tx;
        });
    }
    execWithdrawTokenFromZebecVault(senderAddress, zebecVaultAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, senderAssociatedTokenAddress, escrowAssociatedTokenAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._program.methods
                .tokenWithdrawal(amountBN)
                .accounts({
                zebecVault: zebecVaultAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                sourceAccount: senderAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                sourceAccountTokenAccount: senderAssociatedTokenAddress,
                pdaAccountTokenAccount: escrowAssociatedTokenAddress
            })
                .transaction();
            return tx;
        });
    }
    execStreamInitSol(senderAddress, receiverAddress, escrowAccountKeypair, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSize = config_1.STREAM_SIZE;
            const createAccountIx = yield this._program.account.stream.createInstruction(escrowAccountKeypair, dataSize);
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const canCancel = true;
            const canUpdate = true;
            const tx = this._program.methods
                .nativeStream(startTimeBN, endTimeBN, amountBN, canCancel, canUpdate)
                .accounts({
                dataAccount: escrowAccountKeypair.publicKey,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                systemProgram: web3_js_1.SystemProgram.programId
            })
                .preInstructions([createAccountIx])
                .signers([escrowAccountKeypair])
                .transaction();
            return tx;
        });
    }
    execStreamUpdateSol(escrowAccountPublicKey, withdrawEscrowDataAccountAddress, senderAddress, receiverAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = this._program.methods
                .nativeStream(startTimeBN, endTimeBN, amountBN)
                .accounts({
                dataAccount: escrowAccountPublicKey,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                sender: senderAddress,
                receiver: receiverAddress,
            }).transaction();
            return tx;
        });
    }
    execStreamWithdrawSol(senderAddress, receiverAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
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
    execStreamCancelSol(zebecVaultAddress, senderAddress, receiverAddress, escrowDataAccountAddress, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .cancelStream()
                .accounts({
                zebecVault: zebecVaultAddress,
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowDataAccountAddress,
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
    execStreamPauseSol(senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .pauseStream()
                .accounts({
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            })
                .transaction();
            return tx;
        });
    }
    execStreamResumeSol(senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .pauseStream()
                .accounts({
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            })
                .transaction();
            return tx;
        });
    }
    execStreamInitToken(escrowAccountKeypair, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, senderAddress, receiverAddress, tokenMintAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSize = config_1.STREAM_TOKEN_SIZE;
            const createAccountIx = yield this._program.account.stream.createInstruction(escrowAccountKeypair, dataSize);
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const canCancel = true;
            const canUpdate = true;
            const tx = yield this._program.methods
                .tokenStream(startTimeBN, endTimeBN, amountBN, canCancel, canUpdate)
                .accounts({
                dataAccount: escrowAccountKeypair.publicKey,
                withdrawData: withdrawEscrowDataAccountAddress,
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                sourceAccount: senderAddress,
                destAccount: receiverAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                mint: tokenMintAddress,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY
            })
                .preInstructions([createAccountIx])
                .signers([escrowAccountKeypair])
                .transaction();
            return tx;
        });
    }
    execUpdateStreamInitToken(escrowAccountPublicKey, withdrawEscrowDataAccountAddress, senderAddress, receiverAddress, tokenMintAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTimeBN = new anchor_1.BN(startTime);
            const endTimeBN = new anchor_1.BN(endTime);
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._program.methods
                .tokenStreamUpdate(startTimeBN, endTimeBN, amountBN)
                .accounts({
                dataAccount: escrowAccountPublicKey,
                withdrawData: withdrawEscrowDataAccountAddress,
                sourceAccount: senderAddress,
                destAccount: receiverAddress,
                mint: tokenMintAddress,
            })
                .transaction();
            return tx;
        });
    }
    execStreamWithdrawToken(receiverAddress, senderAddress, feeReceiverAddress, feeVaultDataAddress, feevaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedAccountAddress, receiverAssociatedTokenAddress, feeVaultAssociatedTokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
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
    execStreamCancelToken(senderAddress, receiverAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, receiverAssociatedTokenAddress, feeVaultAssociatedTokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .cancelTokenStream()
                .accounts({
                destAccount: receiverAddress,
                sourceAccount: senderAddress,
                feeOwner: feeReceiverAddress,
                feeVaultData: feeVaultDataAddress,
                feeVault: feeVaultAddress,
                zebecVault: zebecVaultAddress,
                dataAccount: escrowAccountAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
                destTokenAccount: receiverAssociatedTokenAddress,
                feeReceiverTokenAccount: feeVaultAssociatedTokenAddress
            })
                .transaction();
            return tx;
        });
    }
    execStreamPauseToken(senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this._program.methods
                .pauseResumeTokenStream()
                .accounts({
                sender: senderAddress,
                receiver: receiverAddress,
                dataAccount: escrowAccountAddress
            })
                .transaction();
            return tx;
        });
    }
    execInstantSolTransfer(zebecVaultAddress, senderAddress, receiverAddress, withdrawEscrowDataAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._program.methods
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
    execInstantTokenTransfer(zebecVaultAddress, receiverAddress, senderAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, receiverAssociatedTokenAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const amountBN = yield (0, services_1.getAmountInBN)(amount);
            const tx = yield this._program.methods
                .instantTokenTransfer(amountBN)
                .accounts({
                zebecVault: zebecVaultAddress,
                destAccount: receiverAddress,
                sourceAccount: senderAddress,
                withdrawData: withdrawEscrowDataAccountAddress,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: config_1.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                mint: tokenMintAddress,
                pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
                destTokenAccount: receiverAssociatedTokenAddress
            })
                .transaction();
            return tx;
        });
    }
}
exports.ZebecTransactionBuilder = ZebecTransactionBuilder;

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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZebecInstructionBuilder = void 0;
var anchor_1 = require("@project-serum/anchor");
var token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
var web3_js_1 = require("@solana/web3.js");
var ZebecInstructionBuilder = (function () {
    function ZebecInstructionBuilder(program) {
        this._program = program;
    }
    ZebecInstructionBuilder.prototype.createSetVaultInstruction = function (feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, feePercentage) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, calculatedFeePercentage, createSetVaultIx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                feeVault: feeVaultAddress,
                                createVaultData: feeVaultDataAddress,
                                owner: feeReceiverAddress,
                                SystemProgram: web3_js_1.SystemProgram.programId,
                                rent: web3_js_1.SYSVAR_RENT_PUBKEY
                            },
                            signers: [feeReceiverAddress],
                            instructions: []
                        };
                        calculatedFeePercentage = new anchor_1.BN(feePercentage * 100);
                        return [4, this._program.methods.createVault(calculatedFeePercentage, ctx).instruction()];
                    case 1:
                        createSetVaultIx = _a.sent();
                        return [2, createSetVaultIx];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createRetrieveSolFeesInstruction = function (feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                feeOwner: feeReceiverAddress,
                                createVaultData: feeVaultDataAddress,
                                feeVault: feeVaultAddress,
                                systemProgram: web3_js_1.SystemProgram.programId,
                                rent: web3_js_1.SYSVAR_RENT_PUBKEY
                            }
                        };
                        return [4, this._program.methods.withdrawFeesSol(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createRetrieveTokenFeesInstruction = function (feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, tokenMintAddress, feeVaultTokenAccount, feeOwnerTokenAccount) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                feeOwner: feeReceiverAddress,
                                createVaultData: feeVaultDataAddress,
                                feeVault: feeVaultAddress,
                                systemProgram: web3_js_1.SystemProgram.programId,
                                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                                mint: tokenMintAddress,
                                feeReceiverVaultTokenAccount: feeVaultTokenAccount,
                                feeOwnerTokenAccount: feeOwnerTokenAccount
                            },
                            signers: [feeReceiverAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.withdrawFeesToken(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createDepositSolToZebecWalletInstruction = function (senderAddress, zebecVaultAddress, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountBN, ctx, depositSolIx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        amountBN = new anchor_1.BN(amount);
                        ctx = {
                            accounts: {
                                zebecVault: zebecVaultAddress,
                                sender: senderAddress,
                                systemProgram: web3_js_1.SystemProgram.programId
                            },
                            signers: [senderAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.depositSol(amountBN, ctx).instruction()];
                    case 1:
                        depositSolIx = _a.sent();
                        return [2, depositSolIx];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createDepositTokenToZebecWalletInstruction = function (zebecVaultAddress, senderAddress, tokenMintAddress, senderAssociatedTokenAddress, zebecVaultAssociatedAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountBN, ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        amountBN = new anchor_1.BN(amount);
                        ctx = {
                            accounts: {
                                zebecVault: zebecVaultAddress,
                                sourceAccount: senderAddress,
                                systemProgram: web3_js_1.SystemProgram.programId,
                                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                                mint: tokenMintAddress,
                                sourceAccountTokenAccount: senderAssociatedTokenAddress,
                                pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress
                            }
                        };
                        return [4, this._program.methods.depositToken(amount, ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createWithdrawSolFromZebecVaultInstruction = function (senderAddress, zebecVaultAddress, withdrawEscrowDataAccountAddress, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountBN, ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        amountBN = new anchor_1.BN(amount);
                        ctx = {
                            accounts: {
                                zebecVault: zebecVaultAddress,
                                withdrawData: withdrawEscrowDataAccountAddress,
                                systemProgram: web3_js_1.SystemProgram.programId,
                                sender: senderAddress
                            },
                            signers: [senderAddress]
                        };
                        return [4, this._program.methods.initializerNativeWithdrawal(amountBN, ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createWithdrawTokenFromZebecVaultInstruction = function (senderAddress, zebecVaultAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, senderAssociatedTokenAddress, escrowAssociatedTokenAddress, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountBN, ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        amountBN = new anchor_1.BN(amount);
                        ctx = {
                            accounts: {
                                zebecVault: zebecVaultAddress,
                                wtihdrawData: withdrawEscrowDataAccountAddress,
                                sourceAccount: senderAddress,
                                systemProgram: web3_js_1.SystemProgram.programId,
                                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                                mint: tokenMintAddress,
                                sourceAccountTokenAccount: senderAssociatedTokenAddress,
                                pdaAccountTokenAccount: escrowAssociatedTokenAddress
                            },
                            signers: [senderAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.tokenWithdrawal(amount, ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamInitSolInstruction = function (senderAddress, receiverAddress, escrowAccountKeypair, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, startTime, endTime, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var dataSize, ctx, startTimeBN, endTimeBN, amountBN, streamSolIx;
            return __generator(this, function (_a) {
                dataSize = 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 200;
                ctx = {
                    accounts: {
                        dataAccount: escrowAccountKeypair.publicKey,
                        withdrawData: withdrawEscrowDataAccountAddress,
                        feeOwner: feeReceiverAddress,
                        createVaultData: feeVaultDataAddress,
                        feeVault: feeVaultAddress,
                        systemProgram: web3_js_1.SystemProgram.programId,
                        sender: senderAddress,
                        receiver: receiverAddress
                    },
                    instructions: [
                        this._program.account.stream.createInstruction(escrowAccountKeypair, dataSize)
                    ],
                    signers: [senderAddress, escrowAccountKeypair]
                };
                startTimeBN = new anchor_1.BN(startTime);
                endTimeBN = new anchor_1.BN(endTime);
                amountBN = new anchor_1.BN(amount);
                streamSolIx = this._program.instruction.nativeStream(startTimeBN, endTimeBN, amountBN, ctx);
                return [2, streamSolIx];
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamWithdrawSolInstruction = function (senderAddress, receiverAddress, zebecVaultAddress, escrowAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, withdrawSolIx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                zebecVault: zebecVaultAddress,
                                sender: senderAddress,
                                receiver: receiverAddress,
                                dataAccount: escrowAccountAddress,
                                feeOwner: feeReceiverAddress,
                                feeVaultDataAddress: feeVaultDataAddress,
                                feeVault: feeVaultAddress,
                                systemProgram: web3_js_1.SystemProgram.programId
                            },
                            signers: [receiverAddress]
                        };
                        return [4, this._program.methods.withdrawStream(ctx).instruction()];
                    case 1:
                        withdrawSolIx = _a.sent();
                        return [2, withdrawSolIx];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamCancelSolInstruction = function (zebecVaultAddress, senderAddress, receiverAddress, escrowDataAccountAddress, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                zebecVault: zebecVaultAddress,
                                sender: senderAddress,
                                receiver: receiverAddress,
                                dataAccount: escrowDataAccountAddress,
                                withdrawData: withdrawEscrowDataAccountAddress,
                                feeOwner: feeReceiverAddress,
                                createVaultData: feeVaultDataAddress,
                                feeVault: feeVaultAddress,
                                systemProgram: web3_js_1.SystemProgram.programId
                            },
                            singers: [senderAddress]
                        };
                        return [4, this._program.methods.cancelStream(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamPauseSolInstruction = function (senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                sender: senderAddress,
                                receiver: receiverAddress,
                                dataAccount: escrowAccountAddress
                            },
                            signers: [senderAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.pauseStream(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamResumeSolInstruction = function (senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                sender: senderAddress,
                                receiver: receiverAddress,
                                dataAccount: escrowAccountAddress
                            },
                            signers: [senderAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.resumeStream(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamInitTokenInstruction = function (escrowAccountKeypair, withdrawEscrowDataAccountAddress, feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, senderAddress, receiverAddress, tokenMintAddress, startTime, endTime, amount, withdrawLimit) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, startTimeBN, endTimeBN, amountBN, withdrawLimitBN, tokenStreamIx;
            return __generator(this, function (_a) {
                ctx = {
                    accounts: {
                        dataAccount: escrowAccountKeypair.publicKey,
                        withdrawData: withdrawEscrowDataAccountAddress,
                        feeOwner: feeReceiverAddress,
                        createVaultData: feeVaultDataAddress,
                        feeVault: feeVaultAddress,
                        sourceAccount: senderAddress,
                        destAccount: receiverAddress,
                        systemProgram: web3_js_1.SystemProgram.programId,
                        tokenProgram: token_1.TOKEN_PROGRAM_ID,
                        mint: tokenMintAddress,
                        rent: web3_js_1.SYSVAR_RENT_PUBKEY
                    },
                    signers: [senderAddress, escrowAccountKeypair],
                    instructions: []
                };
                startTimeBN = new anchor_1.BN(startTime);
                endTimeBN = new anchor_1.BN(endTime);
                amountBN = new anchor_1.BN(amount);
                withdrawLimitBN = new anchor_1.BN(withdrawLimit);
                tokenStreamIx = this._program.methods.tokenStream(startTimeBN, endTimeBN, amountBN, withdrawLimitBN, ctx).instruction();
                return [2, tokenStreamIx];
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamWithdrawTokenInstruction = function (receiverAddress, senderAddress, feeReceiverAddress, feeVaultDataAddress, feevaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedAccountAddress, receiverAssociatedTokenAddress, feeReceiverAssociatedTokenAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                ctx = {
                    accounts: {
                        destAccount: receiverAddress,
                        sourceAccount: senderAddress,
                        feeOwner: feeReceiverAddress,
                        createVaultData: feeVaultDataAddress,
                        feeVault: feevaultAddress,
                        zebecVault: zebecVaultAddress,
                        dataAccount: escrowAccountAddress,
                        withdrawData: withdrawEscrowDataAccountAddress,
                        systemProgram: web3_js_1.SystemProgram.programId,
                        tokenProgram: token_1.TOKEN_PROGRAM_ID,
                        associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                        mint: tokenMintAddress,
                        pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress,
                        destTokenAccount: receiverAssociatedTokenAddress,
                        feeReceiverAssociatedTokenAddress: feeReceiverAssociatedTokenAddress
                    },
                    signers: [receiverAddress]
                };
                ix = this._program.methods.withdrawTokenStream(ctx).instruction();
                return [2, ix];
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamCancelTokenInstruction = function (senderAddress, receiverAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, escrowAssociatedTokenAddress, receiverAssociatedTokenAddress, feeReceiverAssociatedTokenAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                destAccount: receiverAddress,
                                sourceAccount: senderAddress,
                                feeOwner: feeReceiverAddress,
                                createVaultData: feeVaultDataAddress,
                                feeVault: feeVaultAddress,
                                zebecVault: zebecVaultAddress,
                                dataAccount: escrowAccountAddress,
                                withdrawData: withdrawEscrowDataAccountAddress,
                                systemProgram: web3_js_1.SystemProgram.programId,
                                tokenProgram: token_1.TOKEN_PROGRAM_ID,
                                associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
                                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                                mint: tokenMintAddress,
                                pdaAccountTokenAccount: escrowAssociatedTokenAddress,
                                destTokenAccount: receiverAssociatedTokenAddress,
                                feeReceiverTokenAccount: feeReceiverAssociatedTokenAddress
                            },
                            signers: [senderAddress]
                        };
                        return [4, this._program.methods.cancelTokenStream(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamPauseTokenInstruction = function (senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                sender: senderAddress,
                                receiver: receiverAddress,
                                dataAccount: escrowAccountAddress
                            },
                            signers: [senderAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.pauseResumeTokenStream(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    ZebecInstructionBuilder.prototype.createStreamResumeTokenInstruction = function (senderAddress, receiverAddress, escrowAccountAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = {
                            accounts: {
                                sender: senderAddress,
                                receiver: receiverAddress,
                                dataAccount: escrowAccountAddress
                            },
                            signers: [senderAddress],
                            instructions: []
                        };
                        return [4, this._program.methods.pauseResumeTokenStream(ctx).instruction()];
                    case 1:
                        ix = _a.sent();
                        return [2, ix];
                }
            });
        });
    };
    return ZebecInstructionBuilder;
}());
exports.ZebecInstructionBuilder = ZebecInstructionBuilder;

"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ZebecTokenStream = exports.ZebecNativeStream = void 0;
var anchor_1 = require("@project-serum/anchor");
var token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
var web3_js_1 = require("@solana/web3.js");
var builders_1 = require("../builders");
var constants_1 = require("../config/constants");
var program_id_1 = require("../config/program-id");
var idl_1 = require("../idl");
var transaction_sender_1 = require("./transaction-sender");
var buffer_1 = require("buffer");
window.Buffer = window.Buffer || require("buffer").Buffer;
var ZebecStream = (function () {
    function ZebecStream(anchorProvider, feeReceiver) {
        this.programId = program_id_1.ZEBEC_PROGRAM_ID;
        this.program = new anchor_1.Program(idl_1.ZEBEC_PROGRAM_IDL, this.programId, anchorProvider);
        this.instructionBuilder = new builders_1.ZebecInstructionBuilder(this.program);
        this.transactionSender = new transaction_sender_1.TransactionSender(anchorProvider);
        this.feeReceiverAddress = new web3_js_1.PublicKey(feeReceiver);
    }
    ZebecStream.prototype._findZebecVaultAccount = function (walletAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer()], this.programId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ZebecStream.prototype._findFeeVaultAddress = function (feeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_js_1.PublicKey.findProgramAddress([feeReceiverAddress.toBuffer(), buffer_1.Buffer.from(constants_1.OPERATE)], this.programId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ZebecStream.prototype._findFeeVaultDataAccount = function (feeVaultAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_js_1.PublicKey.findProgramAddress([feeVaultAddress.toBuffer(), buffer_1.Buffer.from(constants_1.OPERATE_DATA), feeVaultAddress.toBuffer()], this.programId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ZebecStream.prototype._findSolWithdrawEscrowAccount = function (walletAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from(constants_1.PREFIX), walletAddress.toBuffer()], this.programId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ZebecStream.prototype._findTokenWithdrawEscrowAccount = function (walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from(constants_1.PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()], this.programId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ZebecStream.prototype._findAssociatedTokenAddress = function (walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer(), token_1.TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()], new web3_js_1.PublicKey(constants_1.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID))];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ZebecStream.prototype.depositSolToZebecVault = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, amount, senderAddress, zebecVaultAddress, ix, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Deposit Sol to Zebec Vault data: ", data);
                        sender = data.sender, amount = data.amount;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        ix = this.instructionBuilder.createDepositSolToZebecWalletInstruction(senderAddress, zebecVaultAddress, amount);
                        signature = "string";
                        return [2, {
                                status: "success",
                                message: "deposited ".concat(amount, " SOL to zebec vault."),
                                data: {
                                    transactionHash: signature
                                }
                            }];
                }
            });
        });
    };
    ZebecStream.prototype.withdrawSolFromZebecVault = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, amount, senderAddress, zebecVaultAddress, withdrawescrowAccountAddress, ix, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Withdraw Sol from Zebec Vault data: ", data);
                        sender = data.sender, amount = data.amount;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findSolWithdrawEscrowAccount(senderAddress)];
                    case 2:
                        withdrawescrowAccountAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createWithdrawSolFromZebecVaultInstruction(senderAddress, zebecVaultAddress, withdrawescrowAccountAddress, amount)];
                    case 3:
                        ix = _a.sent();
                        signature = "string";
                        return [2, {
                                status: "success",
                                message: "".concat(amount, " SOL withdrawn from zebec wallet"),
                                data: {
                                    transactionHash: signature
                                }
                            }];
                }
            });
        });
    };
    ZebecStream.prototype.depositTokenToZebecVault = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, token_mint_address, amount, senderAddress, tokenMintAddress, zebecVaultAddress, senderAssociatedTokenAddress, zebecVaultAssocatedAccountAddress, ix, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Deposit Token to Zebec Vault data: ", data);
                        sender = data.sender, token_mint_address = data.token_mint_address, amount = data.amount;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(senderAddress, tokenMintAddress)];
                    case 2:
                        senderAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress)];
                    case 3:
                        zebecVaultAssocatedAccountAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createDepositTokenToZebecWalletInstruction(zebecVaultAddress, senderAddress, tokenMintAddress, senderAssociatedTokenAddress, zebecVaultAssocatedAccountAddress, amount)];
                    case 4:
                        ix = _a.sent();
                        signature = "string";
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: signature
                                }
                            }];
                }
            });
        });
    };
    ZebecStream.prototype.withdrawTokenFromZebecVault = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, token_mint_address, amount, senderAddress, tokenMintAddress, zebecVaultAddress, withdrawescrowAccountAddress, senderAssociatedTokenAddress, zebecVaultAssocatedAccountAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Withdraw Token From Zebec Vault data: ", data);
                        sender = data.sender, token_mint_address = data.token_mint_address, amount = data.amount;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress)];
                    case 2:
                        withdrawescrowAccountAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(senderAddress, tokenMintAddress)];
                    case 3:
                        senderAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress)];
                    case 4:
                        zebecVaultAssocatedAccountAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createWithdrawTokenFromZebecVaultInstruction(senderAddress, zebecVaultAddress, withdrawescrowAccountAddress, tokenMintAddress, senderAssociatedTokenAddress, zebecVaultAssocatedAccountAddress, amount)];
                    case 5:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    return ZebecStream;
}());
var ZebecNativeStream = (function (_super) {
    __extends(ZebecNativeStream, _super);
    function ZebecNativeStream(anchorProvider, feeReceiver) {
        var _this = _super.call(this, anchorProvider, feeReceiver) || this;
        console.log("Zebec Native Stream object is intialized!!!");
        return _this;
    }
    ZebecNativeStream.prototype.init = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, start_time, end_time, amount, senderAddress, receiverAddress, feeVaultAddress, withdrawEscrowAccountAddress, feeVaultDataAddress, escrowAccountKeypair, ix, tx, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, start_time = data.start_time, end_time = data.end_time, amount = data.amount;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        return [4, this._findFeeVaultAddress(this.feeReceiverAddress)];
                    case 1:
                        feeVaultAddress = (_a.sent())[0];
                        return [4, this._findSolWithdrawEscrowAccount(senderAddress)];
                    case 2:
                        withdrawEscrowAccountAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultDataAccount(feeVaultAddress)];
                    case 3:
                        feeVaultDataAddress = (_a.sent())[0];
                        escrowAccountKeypair = new web3_js_1.Keypair();
                        return [4, this.instructionBuilder.createStreamInitSolInstruction(senderAddress, receiverAddress, escrowAccountKeypair, withdrawEscrowAccountAddress, this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, start_time, end_time, amount)];
                    case 4:
                        ix = _a.sent();
                        return [4, this.transactionSender.makeTxn(__assign({}, ix), escrowAccountKeypair)];
                    case 5:
                        tx = _a.sent();
                        return [4, this.transactionSender.sendOne(tx)];
                    case 6:
                        signature = _a.sent();
                        console.log(signature, "Signature");
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: signature
                                }
                            }];
                }
            });
        });
    };
    ZebecNativeStream.prototype.pause = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, senderAddress, receiverAddress, escrowAccountAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this.instructionBuilder.createStreamPauseSolInstruction(senderAddress, receiverAddress, escrowAccountAddress)];
                    case 1:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecNativeStream.prototype.resume = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, senderAddress, receiverAddress, escrowAccountAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this.instructionBuilder.createStreamResumeSolInstruction(senderAddress, receiverAddress, escrowAccountAddress)];
                    case 1:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecNativeStream.prototype.cancel = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, senderAddress, receiverAddress, escrowAccountAddress, zebecVaultAddress, feeVaultAddress, feeVaultDataAddress, withdrawescrowAccountAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultAddress(this.feeReceiverAddress)];
                    case 2:
                        feeVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultDataAccount(feeVaultAddress)];
                    case 3:
                        feeVaultDataAddress = (_a.sent())[0];
                        return [4, this._findSolWithdrawEscrowAccount(senderAddress)];
                    case 4:
                        withdrawescrowAccountAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createStreamCancelSolInstruction(zebecVaultAddress, senderAddress, receiverAddress, escrowAccountAddress, withdrawescrowAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress)];
                    case 5:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecNativeStream.prototype.withdraw = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, senderAddress, receiverAddress, escrowAccountAddress, zebecVaultAddress, feeVaultAddress, feeVaultDataAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultAddress(this.feeReceiverAddress)];
                    case 2:
                        feeVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultDataAccount(feeVaultAddress)];
                    case 3:
                        feeVaultDataAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createStreamWithdrawSolInstruction(senderAddress, receiverAddress, zebecVaultAddress, escrowAccountAddress, this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress)];
                    case 4:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    return ZebecNativeStream;
}(ZebecStream));
exports.ZebecNativeStream = ZebecNativeStream;
var ZebecTokenStream = (function (_super) {
    __extends(ZebecTokenStream, _super);
    function ZebecTokenStream(anchorProvider, feeReceiver) {
        var _this = _super.call(this, anchorProvider, feeReceiver) || this;
        console.log("Zebec Token Stream object is initialized!!!");
        return _this;
    }
    ZebecTokenStream.prototype.init = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, token_mint_address, start_time, end_time, amount, withdraw_limit, senderAddress, receiverAddress, tokenMintAddress, feeVaultAddress, feeVaultDataAddress, withdrawEscrowAccountAddress, escrowAccountKeypair, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, token_mint_address = data.token_mint_address, start_time = data.start_time, end_time = data.end_time, amount = data.amount, withdraw_limit = data.withdraw_limit;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
                        return [4, this._findFeeVaultAddress(this.feeReceiverAddress)];
                    case 1:
                        feeVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultDataAccount(feeVaultAddress)];
                    case 2:
                        feeVaultDataAddress = (_a.sent())[0];
                        return [4, this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress)];
                    case 3:
                        withdrawEscrowAccountAddress = (_a.sent())[0];
                        escrowAccountKeypair = web3_js_1.Keypair.generate();
                        return [4, this.instructionBuilder.createStreamInitTokenInstruction(escrowAccountKeypair, withdrawEscrowAccountAddress, this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, senderAddress, receiverAddress, tokenMintAddress, start_time, end_time, amount, withdraw_limit)];
                    case 4:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecTokenStream.prototype.pause = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, senderAddress, receiverAddress, escrowAccountAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this.instructionBuilder.createStreamPauseTokenInstruction(senderAddress, receiverAddress, escrowAccountAddress)];
                    case 1:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecTokenStream.prototype.resume = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, senderAddress, receiverAddress, escrowAccountAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this.instructionBuilder.createStreamPauseTokenInstruction(senderAddress, receiverAddress, escrowAccountAddress)];
                    case 1:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecTokenStream.prototype.cancel = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, escrow, token_mint_address, senderAddress, receiverAddress, tokenMintAddress, escrowAccountAddress, zebecVaultAddress, feeVaultAddress, feeVaultDataAddress, withdrawEscrowDataAccountAddress, escrowAssociatedTokenAddress, receiverAssociatedTokenAddress, feeReceiverAssociatedTokenAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, escrow = data.escrow, token_mint_address = data.token_mint_address;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultAddress(this.feeReceiverAddress)];
                    case 2:
                        feeVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultDataAccount(feeVaultAddress)];
                    case 3:
                        feeVaultDataAddress = (_a.sent())[0];
                        return [4, this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress)];
                    case 4:
                        withdrawEscrowDataAccountAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(escrowAccountAddress, tokenMintAddress)];
                    case 5:
                        escrowAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(escrowAccountAddress, tokenMintAddress)];
                    case 6:
                        receiverAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(this.feeReceiverAddress, tokenMintAddress)];
                    case 7:
                        feeReceiverAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createStreamCancelTokenInstruction(senderAddress, receiverAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, escrowAssociatedTokenAddress, receiverAssociatedTokenAddress, feeReceiverAssociatedTokenAddress)];
                    case 8:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    ZebecTokenStream.prototype.withdraw = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sender, receiver, token_mint_address, escrow, senderAddress, receiverAddress, tokenMintAddress, escrowAccountAddress, zebecVaultAddress, withdrawEscrowAccountAddress, feeVaultAddress, feeVaultDataAddress, zebecVaultAssociatedAccountAddress, receiverAssociatedTokenAddress, feeReceiverAssociatedTokenAddress, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sender = data.sender, receiver = data.receiver, token_mint_address = data.token_mint_address, escrow = data.escrow;
                        senderAddress = new web3_js_1.PublicKey(sender);
                        receiverAddress = new web3_js_1.PublicKey(receiver);
                        tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
                        escrowAccountAddress = new web3_js_1.PublicKey(escrow);
                        return [4, this._findZebecVaultAccount(senderAddress)];
                    case 1:
                        zebecVaultAddress = (_a.sent())[0];
                        return [4, this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress)];
                    case 2:
                        withdrawEscrowAccountAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultAddress(this.feeReceiverAddress)];
                    case 3:
                        feeVaultAddress = (_a.sent())[0];
                        return [4, this._findFeeVaultDataAccount(feeVaultAddress)];
                    case 4:
                        feeVaultDataAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress)];
                    case 5:
                        zebecVaultAssociatedAccountAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress)];
                    case 6:
                        receiverAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this._findAssociatedTokenAddress(this.feeReceiverAddress, tokenMintAddress)];
                    case 7:
                        feeReceiverAssociatedTokenAddress = (_a.sent())[0];
                        return [4, this.instructionBuilder.createStreamWithdrawTokenInstruction(receiverAddress, senderAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowAccountAddress, tokenMintAddress, zebecVaultAssociatedAccountAddress, receiverAssociatedTokenAddress, feeReceiverAssociatedTokenAddress)];
                    case 8:
                        ix = _a.sent();
                        return [2, {
                                status: "success",
                                message: "hello world",
                                data: {
                                    transactionHash: "string"
                                }
                            }];
                }
            });
        });
    };
    return ZebecTokenStream;
}(ZebecStream));
exports.ZebecTokenStream = ZebecTokenStream;

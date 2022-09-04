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
exports.ZebecTokenTreasury = exports.ZebecNativeTreasury = exports.ZebecMultisig = void 0;
const anchor_1 = require("@project-serum/anchor");
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const idl_1 = require("../idl");
const instruction_1 = require("../instruction");
const accounts_1 = require("./accounts");
const utils_1 = require("./utils");
class ZebecMultisig {
    constructor(anchorProvider, feeReceiver, logger = false) {
        this.multisigProgramId = new web3_js_1.PublicKey(config_1.ZEBEC_PROGRAM_ID.MULTISIG);
        this.streamProgramId = new web3_js_1.PublicKey(config_1.ZEBEC_PROGRAM_ID.STREAM);
        this.anchorProvider = anchorProvider;
        this.multisigProgram = new anchor_1.Program(idl_1.ZEBEC_MULTISIG_PROGRAM_IDL, this.multisigProgramId, this.anchorProvider);
        this.streamProgram = new anchor_1.Program(idl_1.ZEBEC_STREAM_PROGRAM_IDL, this.streamProgramId, this.anchorProvider);
        this.transactionBuilder = new instruction_1.ZebecTransactionBuilder(this.multisigProgram, this.streamProgram);
        this.feeReceiverAddress = new web3_js_1.PublicKey(feeReceiver);
        this.logger = logger;
        this.consolelog = new utils_1.ConsoleLog(this.logger);
    }
    _findZebecVaultAccount(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [zebecVaultAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer()], this.streamProgramId);
            this.consolelog.info(`zebec wallet address: ${zebecVaultAddress.toString()}`);
            return [zebecVaultAddress, nonce];
        });
    }
    _findSolWithdrawEscrowAccount(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [withdrawEscrowAccountAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(config_1.SC_CONSTANT.PREFIX), walletAddress.toBuffer()], this.streamProgram.programId);
            this.consolelog.info(`withdraw-sol escrow account address: ${withdrawEscrowAccountAddress.toString()}`);
            return [withdrawEscrowAccountAddress, nonce];
        });
    }
    _findSafeAddress(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer()], this.multisigProgramId);
        });
    }
    _findFeeVaultAddress(feeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [feeVaultAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([feeReceiverAddress.toBuffer(), Buffer.from(config_1.SC_CONSTANT.OPERATE)], this.streamProgramId);
            this.consolelog.info(`fee vault address: ${feeVaultAddress.toString()}`);
            return [feeVaultAddress, nonce];
        });
    }
    _findFeeVaultDataAccount(feeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [feeVaultAddress] = yield this._findFeeVaultAddress(feeReceiverAddress);
            const [feeVaultDataAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([feeReceiverAddress.toBuffer(), Buffer.from(config_1.SC_CONSTANT.OPERATE_DATA), feeVaultAddress.toBuffer()], this.streamProgramId);
            this.consolelog.info(`fee vault data address: ${feeVaultDataAddress}`);
            return [feeVaultDataAddress, nonce];
        });
    }
    _findTokenWithdrawEscrowAccount(walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [withdrawTokenEscrowAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(config_1.SC_CONSTANT.PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()], this.streamProgramId);
            this.consolelog.info(`withdraw-token escrow account address: ${withdrawTokenEscrowAddress}`);
            return [withdrawTokenEscrowAddress, nonce];
        });
    }
    _findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [associatedTokenAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer(), token_1.TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()], new web3_js_1.PublicKey(config_1.SC_CONSTANT.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID));
            this.consolelog.info(`associated token address: ${associatedTokenAddress}`);
            return [associatedTokenAddress, nonce];
        });
    }
    _getAccociatedTokenAddress(walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const pdaTokenData = yield (0, spl_token_1.getAssociatedTokenAddress)(tokenMintAddress, walletAddress, true, token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            return pdaTokenData;
        });
    }
    _fetchTresholdData(stream_data_account) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.multisigProgram.account.multisig.fetch(stream_data_account);
            return response;
        });
    }
    fetchMultiSigStreamData(stream_data_account) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.multisigProgram.account.transaction.fetch(stream_data_account);
            return response;
        });
    }
    _makeTxn(tx, escrow = null) {
        return __awaiter(this, void 0, void 0, function* () {
            this.consolelog.info('---- adding fee payer, blockhash & signing tx ----');
            const latestBlockhash = yield this.anchorProvider.connection.getLatestBlockhash(this.anchorProvider.connection.commitment);
            tx.feePayer = this.anchorProvider.wallet.publicKey;
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
            if (escrow) {
                tx.partialSign(...escrow);
            }
            return tx;
        });
    }
    createSafe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { owners, min_confirmation_required } = data;
            const multisigDataAccount = web3_js_1.Keypair.generate();
            const ownerAddresses = owners.map((owner) => new web3_js_1.PublicKey(owner));
            const [multisigSigner, multisigSafeNonce] = yield this._findSafeAddress(multisigDataAccount.publicKey);
            const anchorTx = yield this.transactionBuilder.execCreateSafe(multisigDataAccount, multisigSafeNonce, ownerAddresses, min_confirmation_required);
            const tx = yield this._makeTxn(anchorTx, [multisigDataAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'created safe',
                    data: {
                        transactionHash: signature,
                        safe_address: multisigSigner.toBase58(),
                        safe_data_account: multisigDataAccount.publicKey.toBase58()
                    }
                };
            }
            catch (err) {
                throw new Error((0, utils_1.parseErrorMessage)(err.message));
            }
        });
    }
    createFeeVault(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fee_percentage } = data;
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            this.consolelog.info(`creating fee vault for with ${fee_percentage}%`);
            const anchorTx = yield this.transactionBuilder.execFeeVault(this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, fee_percentage);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'created fee vault',
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                throw new Error((0, utils_1.parseErrorMessage)(err.message));
            }
        });
    }
    depositSolToSafe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, safe_address, amount } = data;
            console.log('deposit to safe: ', data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const zebecSafeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(senderAddress);
            const [withdrawEscrowDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(senderAddress);
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            console.log('senderAddress', senderAddress.toString());
            console.log('zebecVaultAddress masterpda', zebecVaultAddress.toString());
            console.log('zebecSafeAddress', zebecSafeAddress.toString());
            console.log('withdrawEscrowDataAccountAddress', withdrawEscrowDataAccountAddress.toString());
            const anchorTx = yield this.transactionBuilder.execDepositSol(zebecVaultAddress, senderAddress, zebecSafeAddress, withdrawEscrowDataAccountAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'deposit successful',
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    depositTokenToSafe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, safe_address, token_mint_address, amount } = data;
            const senderAddress = new web3_js_1.PublicKey(sender);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(senderAddress);
            const amountInLamports = yield (0, utils_1.getTokenAmountInLamports)(amount, tokenMintAddress, this.streamProgram);
            const [zebecVaultAssociatedTokenAddress] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const [safeAssociatedTokenAddress] = yield this._findAssociatedTokenAddress(safeAddress, tokenMintAddress);
            const [withdrawEscrowAccountAddress] = yield this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
            const anchorTx = yield this.transactionBuilder.execDepositToken(zebecVaultAddress, safeAddress, senderAddress, withdrawEscrowAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, safeAssociatedTokenAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'deposit successful',
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
}
exports.ZebecMultisig = ZebecMultisig;
class ZebecNativeTreasury extends ZebecMultisig {
    constructor(anchorProvider, feeReceiver, logger = false) {
        super(anchorProvider, feeReceiver, logger);
        this.consolelog.info('zebec native treasury object initialized!');
    }
    deposit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, sender, amount } = data;
            const senderAddress = new web3_js_1.PublicKey(sender);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            const anchorTx = yield this.transactionBuilder.execDepositToVault(zebecVaultAddress, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'Deposited !',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execDespoit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, transaction_account, signer } = data;
            console.log(data);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const depositAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(depositAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            ownerarray.forEach((owner) => { console.log(owner.toString()); });
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.deposit(zebecVaultAddress, safeAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                console.log('approve');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, depositAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, depositAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Deposit transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, depositAccountAddress, signer);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Deposit transaction Approved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    init(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount } = data;
            this.consolelog.info('multisig init stream: ', data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawDataAccount] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const streamDataAccount = web3_js_1.Keypair.generate();
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            const anchorTx = yield this.transactionBuilder.execInitStream(safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccount, withdrawDataAccount, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, senderAddress, receiverAddress, start_time, end_time, amountInLamports);
            const tx = yield this._makeTxn(anchorTx, [streamDataAccount, zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream initiated!',
                    data: {
                        transactionHash: signature,
                        stream_data_account: streamDataAccount.publicKey.toString(),
                        transaction_account: zebecTransactionAccount.publicKey.toString(),
                        safe_data_account: safeDataAccount.toString()
                    }
                };
            }
            catch (err) {
                console.log(err.data);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execInit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data;
            console.log(data);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const initTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(initTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.init(streamDataAccountAddress, withdrawDataAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                console.log('approve & execution');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, initTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, initTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'stream transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, initTransactionAccountAddress, signer);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'stream transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    pause(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execPauseStream(safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream paused!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execPause(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data;
            console.log(data);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const pauseTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(pauseTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.pause(safeAddress, receiverAddress, streamDataAccountAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                console.log('approve');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, pauseTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, pauseTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Pause transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, pauseTransactionAccountAddress, signer);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Pause transaction Approved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    resume(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execPauseStream(safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream resumed!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execResume(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data;
            console.log(data);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const pauseTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(pauseTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.resume(safeAddress, receiverAddress, streamDataAccountAddress);
            const threshholdCount = safe_details.threshold.toString();
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            console.log('threshholdCount', threshholdCount);
            if (Number(count + 1) === Number(threshholdCount)) {
                console.log('approve & execution');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, pauseTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, pauseTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Resume transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, pauseTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Resume transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    cancel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execCancelStream(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream Cancel!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execCancel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data;
            console.log(data);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const cancelTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(cancelTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.cancel(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, withdrawDataAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, cancelTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, cancelTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Cancel transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, cancelTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Cancel transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    instanttransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, safe_data_account, sender } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execInstantStream(zebecVaultAddress, safeAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'Instant transfer created !',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execInstanttransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, transaction_account, receiver, signer } = data;
            console.log(data);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const instantTransferTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findSolWithdrawEscrowAccount(safeAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(instantTransferTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.instanttransfer(zebecVaultAddress, safeAddress, receiverAddress, withdrawDataAccountAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, instantTransferTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, instantTransferTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Instant transfer transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, instantTransferTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Instant transfer transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    fetchStreamData(stream_data_account) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.streamProgram.account.stream.fetch(stream_data_account);
            return response;
        });
    }
}
exports.ZebecNativeTreasury = ZebecNativeTreasury;
class ZebecTokenTreasury extends ZebecMultisig {
    constructor(anchorProvider, feeReceiver, logger = false) {
        super(anchorProvider, feeReceiver, logger);
        this.consolelog.info('zebec token treasury object initialized!');
    }
    deposit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, sender, amount, token_mint_address } = data;
            const senderAddress = new web3_js_1.PublicKey(sender);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const pdaTokenData = yield this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const [zebecVaultAssociatedTokenAddress] = yield this._findAssociatedTokenAddress(safeAddress, tokenMintAddress);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            const anchorTx = yield this.transactionBuilder.execDepositTokenToVault(zebecVaultAddress, safeAddress, safeDataAccount, zebecTransactionAccount, senderAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData, amountInLamports);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'Token Deposited !',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execDespoit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, transaction_account, signer, token_mint_address } = data;
            console.log(data);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const depositAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const pdaTokenData = yield this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const [zebecVaultAssociatedTokenAddress] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(depositAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.depositToken(zebecVaultAddress, safeAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                console.log('approve');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, depositAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, depositAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Deposit transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, depositAccountAddress, signer);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Deposit transaction Approved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    init(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount, token_mint_address } = data;
            this.consolelog.info('multisig init stream: ', data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawDataAccount] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccount);
            const owners = safe_details.owners;
            const streamDataAccount = web3_js_1.Keypair.generate();
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const amountInLamports = yield (0, utils_1.getTokenAmountInLamports)(amount, tokenMintAddress, this.multisigProgram);
            const anchorTx = yield this.transactionBuilder.execStreamInitToken(owners, safeAddress, safeDataAccount, zebecTransactionAccount, streamDataAccount, withdrawDataAccount, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, senderAddress, receiverAddress, tokenMintAddress, start_time, end_time, amountInLamports);
            const tx = yield this._makeTxn(anchorTx, [streamDataAccount, zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream initiated!',
                    data: {
                        transactionHash: signature,
                        stream_data_account: streamDataAccount.publicKey.toString(),
                        transaction_account: zebecTransactionAccount.publicKey.toString(),
                        safe_data_account: safeDataAccount.toString()
                    }
                };
            }
            catch (err) {
                console.log(err.data);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execInit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data;
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const initTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(initTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('safe address', safeAddress.toString());
            console.log('withdraw token data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress token data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.inittoken(streamDataAccountAddress, withdrawDataAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress, tokenMintAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, initTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, initTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'stream token transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, initTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Stream transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    pause(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;
            console.log('pause transaction');
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const safe_details = yield this._fetchTresholdData(safeDataAccount);
            const owners = safe_details.owners;
            const senderAddress = new web3_js_1.PublicKey(sender);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execStreamPauseToken(owners, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream paused!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execPause(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data;
            console.log(data);
            console.log('execute pause');
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const pauseTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(pauseTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('safe address', safeAddress.toString());
            console.log('withdraw Token data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress token data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.pausetoken(safeAddress, receiverAddress, streamDataAccountAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, pauseTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, pauseTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Pause transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, pauseTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Pause transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    resume(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execPauseStream(safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream Resumed!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execResume(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data;
            console.log(data);
            console.log('execute resume');
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const resumeTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(resumeTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('safe address', safeAddress.toString());
            console.log('withdraw Token data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress token data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.resumetoken(safeAddress, receiverAddress, streamDataAccountAddress);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, resumeTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, resumeTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Resume transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, resumeTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Resume transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    cancel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, stream_data_account, safe_data_account, sender, token_mint_address } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const safe_details = yield this._fetchTresholdData(safeDataAccount);
            const owners = safe_details.owners;
            const senderAddress = new web3_js_1.PublicKey(sender);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const pdaTokenData = yield this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const destTokenData = yield this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress);
            const feeTokenData = yield this._getAccociatedTokenAddress(feeVaultAddress, tokenMintAddress);
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execStreamCancelToken(owners, zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, tokenMintAddress, pdaTokenData, destTokenData, feeTokenData);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'stream Cancel!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execCancel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data;
            console.log(data);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const streamDataAccountAddress = new web3_js_1.PublicKey(stream_data_account);
            const [feeVaultAddress] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const cancelTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(cancelTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('safe address', safeAddress.toString());
            const pdaTokenData = yield this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const destTokenData = yield this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress);
            const feeTokenData = yield this._getAccociatedTokenAddress(feeVaultAddress, tokenMintAddress);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.canceltoken(zebecVaultAddress, receiverAddress, safeAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, streamDataAccountAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData, feeTokenData);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, cancelTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, cancelTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Cancel transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, cancelTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Cancel transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    instanttransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, receiver, safe_data_account, sender, token_mint_address } = data;
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const safeDataAccount = new web3_js_1.PublicKey(safe_data_account);
            const safe_details = yield this._fetchTresholdData(safeDataAccount);
            const owners = safe_details.owners;
            const senderAddress = new web3_js_1.PublicKey(sender);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const pdaTokenData = yield this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            console.log('pdaTokenData , Transaction create', pdaTokenData.toString());
            const destTokenData = yield this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress);
            console.log('destTokenData , Transaction create', destTokenData.toString());
            const zebecTransactionAccount = web3_js_1.Keypair.generate();
            const anchorTx = yield this.transactionBuilder.execInstantStreamToken(owners, zebecVaultAddress, safeAddress, receiverAddress, zebecTransactionAccount, safeDataAccount, senderAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData);
            const tx = yield this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info('transaction after signing: ', signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    status: 'success',
                    message: 'Instant transfer success!',
                    data: {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString()
                    }
                };
            }
            catch (err) {
                console.log(err);
                return {
                    status: 'error',
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    execInstanttransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data;
            console.log(data);
            const safeAddress = new web3_js_1.PublicKey(safe_address);
            const [zebecVaultAddress] = yield this._findZebecVaultAccount(safeAddress);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultDataAddress] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const safeDataAccountAddress = new web3_js_1.PublicKey(safe_data_account);
            const instantTransferTransactionAccountAddress = new web3_js_1.PublicKey(transaction_account);
            const [withdrawDataAccountAddress] = yield this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress);
            const safe_details = yield this._fetchTresholdData(safeDataAccountAddress);
            const transaction_details = yield this.fetchMultiSigStreamData(instantTransferTransactionAccountAddress);
            console.log('safe_details', safe_details);
            const ownerarray = safe_details.owners;
            const signaturesarray = transaction_details.signers;
            console.log('signaturesarray', signaturesarray);
            console.log('ownerarray', ownerarray);
            const obj = {};
            ownerarray.forEach((element, index) => {
                obj[element] = signaturesarray[index];
            });
            const signcheck = obj[signer];
            console.log('result', signcheck);
            console.log('transactions', transaction_details);
            console.log('safe address', safeAddress.toString());
            console.log('Multisig vitra ko zbc vault', zebecVaultAddress.toString());
            const pdaTokenData = yield this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            console.log('pdaTokenData , Transaction create', pdaTokenData.toString());
            const destTokenData = yield this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress);
            console.log('withdraw sol data', withdrawDataAccountAddress.toString());
            console.log('feeVaultDataAddress sol data', feeVaultDataAddress.toString());
            const initAccounts = accounts_1.AccountKeys.instanttransfertoken(zebecVaultAddress, receiverAddress, safeAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData);
            const threshholdCount = safe_details.threshold.toString();
            console.log('threshholdCount', threshholdCount);
            const count = signaturesarray.filter((value) => value === true).length;
            console.log('count', count);
            if (Number(count + 1) === Number(threshholdCount)) {
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, instantTransferTransactionAccountAddress, signer);
                const remainingAccounts = accounts_1.AccountKeys.remainingAccounts(initAccounts, safeAddress);
                const anchorExecTx = yield this.transactionBuilder.execTransaction(safeAddress, safeDataAccountAddress, instantTransferTransactionAccountAddress, remainingAccounts);
                anchorTx.add(anchorExecTx);
                console.log('anchor transaction', anchorTx);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Instant transfer transaction executed!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
            else {
                console.log('Approve Transaction');
                const anchorTx = yield this.transactionBuilder.execApproveTransaction(safeDataAccountAddress, instantTransferTransactionAccountAddress, signer);
                const tx = yield this._makeTxn(anchorTx);
                const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
                this.consolelog.info('transaction after signing: ', signedRawTx);
                try {
                    const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                    this.consolelog.info(`transaction success, TXID: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Instant transfer transaction Aprroved!!',
                        data: {
                            transactionHash: signature
                        }
                    };
                }
                catch (err) {
                    console.log(err);
                    return {
                        status: 'error',
                        message: (0, utils_1.parseErrorMessage)(err.message),
                        data: null
                    };
                }
            }
        });
    }
    fetchStreamData(stream_data_account) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.streamProgram.account.stream.fetch(stream_data_account);
            return response;
        });
    }
    withdraw() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.ZebecTokenTreasury = ZebecTokenTreasury;

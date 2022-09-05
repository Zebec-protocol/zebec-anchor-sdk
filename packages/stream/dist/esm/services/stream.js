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
exports.ZebecTokenStream = exports.ZebecNativeStream = void 0;
const buffer_1 = require("buffer");
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const idl_1 = require("../idl");
const utils_1 = require("./utils");
const instruction_1 = require("../instruction");
const constants_1 = require("../config/constants");
class ZebecStream {
    constructor(anchorProvider, feeReceiver, logger) {
        this.programId = constants_1.ZEBEC_PROGRAM_ID;
        this.anchorProvider = anchorProvider;
        this.program = new anchor_1.Program(idl_1.ZEBEC_PROGRAM_IDL, this.programId, this.anchorProvider);
        this.transactionBuilder = new instruction_1.ZebecTransactionBuilder(this.program);
        this.feeReceiverAddress = new web3_js_1.PublicKey(feeReceiver);
        this.console = new utils_1.ConsoleLog(logger);
    }
    _findZebecVaultAccount(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [zebecVaultAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer()], this.programId);
            this.console.info(`zebec wallet address: ${zebecVaultAddress.toString()}`);
            return [zebecVaultAddress, nonce];
        });
    }
    _findFeeVaultAddress(feeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [feeVaultAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([feeReceiverAddress.toBuffer(), buffer_1.Buffer.from(constants_1.OPERATE)], this.programId);
            this.console.info(`fee vault address: ${feeVaultAddress.toString()}`);
            return [feeVaultAddress, nonce];
        });
    }
    _findFeeVaultDataAccount(feeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(feeReceiverAddress);
            const [feeVaultDataAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([feeReceiverAddress.toBuffer(), buffer_1.Buffer.from(constants_1.OPERATE_DATA), feeVaultAddress.toBuffer()], this.programId);
            this.console.info(`fee vault data address: ${feeVaultDataAddress}`);
            return [feeVaultDataAddress, nonce];
        });
    }
    _findSolWithdrawEscrowAccount(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [withdrawEscrowAccountAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from(constants_1.PREFIX), walletAddress.toBuffer()], this.programId);
            this.console.info(`withdraw-sol escrow account address: ${withdrawEscrowAccountAddress.toString()}`);
            return [withdrawEscrowAccountAddress, nonce];
        });
    }
    _findTokenWithdrawEscrowAccount(walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [withdrawTokenEscrowAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from(constants_1.PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()], this.programId);
            this.console.info(`withdraw-token escrow account address: ${withdrawTokenEscrowAddress}`);
            return [withdrawTokenEscrowAddress, nonce];
        });
    }
    _findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const [associatedTokenAddress, nonce] = yield web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer(), token_1.TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()], new web3_js_1.PublicKey(constants_1.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID));
            this.console.info(`associated token address: ${associatedTokenAddress}`);
            return [associatedTokenAddress, nonce];
        });
    }
    _makeTxn(tx, escrow = null) {
        return __awaiter(this, void 0, void 0, function* () {
            this.console.info("---- adding fee payer, blockhash & signing tx ----");
            const latestBlockhash = yield this.anchorProvider.connection.getLatestBlockhash(this.anchorProvider.connection.commitment);
            tx.feePayer = this.anchorProvider.wallet.publicKey;
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
            if (escrow) {
                tx.partialSign(escrow);
            }
            ;
            return tx;
        });
    }
    createFeeVault(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fee_percentage } = data;
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            this.console.info(`creating fee vault for with ${fee_percentage}%`);
            const anchorTx = yield this.transactionBuilder.execFeeVault(this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, fee_percentage);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    "status": "success",
                    "message": "created fee vault",
                    "data": {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    collectSolFees() {
        return __awaiter(this, void 0, void 0, function* () {
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const anchorTx = yield this.transactionBuilder.execRetrieveSolFees(this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    "status": "success",
                    "message": "fee withdraw successful",
                    "data": {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    collectTokenFees(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token_mint_address } = data;
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [feeVaultTokenAccountAddress,] = yield this._findAssociatedTokenAddress(feeVaultAddress, tokenMintAddress);
            const [feeOwnerTokenAccountAddress,] = yield this._findAssociatedTokenAddress(this.feeReceiverAddress, tokenMintAddress);
            const anchorTx = yield this.transactionBuilder.execRetrieveTokenFees(this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, tokenMintAddress, feeVaultTokenAccountAddress, feeOwnerTokenAccountAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    "status": "success",
                    "message": "fee withdraw successful",
                    "data": {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    depositSolToZebecVault(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, amount } = data;
            this.console.info(`depositing, ${amount} SOL to zebec vault!`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            const anchorTx = yield this.transactionBuilder.execDepositSolToZebecWallet(senderAddress, zebecVaultAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `deposited ${amount} SOL to zebec vault.`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    withdrawSolFromZebecVault(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, amount } = data;
            this.console.info(`withdrawing ${amount} SOL fromm zebec vault!`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [withdrawescrowAccountAddress,] = yield this._findSolWithdrawEscrowAccount(senderAddress);
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            const anchorTx = yield this.transactionBuilder.execWithdrawSolFromZebecVault(senderAddress, zebecVaultAddress, withdrawescrowAccountAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `${amount} SOL is withdrawn from zebec vault.`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    depositTokenToZebecVault(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, token_mint_address, amount } = data;
            this.console.info(`depositing ${amount} to zebec wallet`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [senderAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
            const [zebecVaultAssocatedAccountAddress,] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const amountInLamports = yield (0, utils_1.getTokenAmountInLamports)(amount, tokenMintAddress, this.program);
            const anchorTx = yield this.transactionBuilder.execDepositTokenToZebecWallet(zebecVaultAddress, senderAddress, tokenMintAddress, senderAssociatedTokenAddress, zebecVaultAssocatedAccountAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `${amount} is deposited to zebec vault`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    withdrawTokenFromZebecVault(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, token_mint_address, amount } = data;
            this.console.info(`withrawing ${amount} from zebec vault`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [withdrawescrowAccountAddress,] = yield this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
            const [senderAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
            const [zebecVaultAssocatedAccountAddress,] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const amountInLamports = yield (0, utils_1.getTokenAmountInLamports)(amount, tokenMintAddress, this.program);
            const anchorTx = yield this.transactionBuilder.execWithdrawTokenFromZebecVault(senderAddress, zebecVaultAddress, withdrawescrowAccountAddress, tokenMintAddress, senderAssociatedTokenAddress, zebecVaultAssocatedAccountAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `${amount} is withdrawn from zebec vault`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
}
class ZebecNativeStream extends ZebecStream {
    constructor(anchorProvider, feeReceiver, logger = false) {
        super(anchorProvider, feeReceiver, logger);
        this.console.info("zebec native stream object initialized!");
    }
    init(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, start_time, end_time, amount } = data;
            this.console.info(`sending ${amount} SOL to ${receiver}`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [withdrawEscrowAccountAddress,] = yield this._findSolWithdrawEscrowAccount(senderAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const escrowAccountKeypair = web3_js_1.Keypair.generate();
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            console.log('fee vault address', feeVaultAddress.toBase58());
            console.log('fee vault data address', feeVaultDataAddress.toBase58());
            const anchorTx = yield this.transactionBuilder.execStreamInitSol(senderAddress, receiverAddress, escrowAccountKeypair, withdrawEscrowAccountAddress, this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, start_time, end_time, amountInLamports);
            const tx = yield this._makeTxn(anchorTx, escrowAccountKeypair);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `stream started. ${amount} SOL`,
                    data: {
                        transactionHash: signature,
                        pda: escrowAccountKeypair.publicKey.toString(),
                        withdrawescrow: withdrawEscrowAccountAddress.toString(),
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    pause(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow } = data;
            this.console.info(`stream pause data:`, data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const anchorTx = yield this.transactionBuilder.execStreamPauseSol(senderAddress, receiverAddress, escrowAccountAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `stream paused`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    resume(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow } = data;
            this.console.info(`resume stream data: ${data}`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const anchorTx = yield this.transactionBuilder.execStreamResumeSol(senderAddress, receiverAddress, escrowAccountAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `stream resumed`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    cancel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow } = data;
            this.console.info(`cancel stream data: ${data}`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawescrowAccountAddress,] = yield this._findSolWithdrawEscrowAccount(senderAddress);
            const anchorTx = yield this.transactionBuilder.execStreamCancelSol(zebecVaultAddress, senderAddress, receiverAddress, escrowAccountAddress, withdrawescrowAccountAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `stream canceled`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    withdraw(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow } = data;
            this.console.info(`withdraw from stream data: ${data}`);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawEscrowAccountAddress,] = yield this._findSolWithdrawEscrowAccount(senderAddress);
            const anchorTx = yield this.transactionBuilder.execStreamWithdrawSol(senderAddress, receiverAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowAccountAddress, this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `withdraw completed`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    instantTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, amount } = data;
            this.console.info("instant token transfer: ", data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const amountInLamports = (0, utils_1.getAmountInLamports)(amount);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [withdrawEscrowAccountAddress,] = yield this._findSolWithdrawEscrowAccount(senderAddress);
            const anchorTx = yield this.transactionBuilder.execInstantSolTransfer(zebecVaultAddress, senderAddress, receiverAddress, withdrawEscrowAccountAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `transfer completed`,
                    data: {
                        transactionHash: signature
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    fetchStreamData(escrow) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.program.account.stream.fetch(escrow);
            return response;
        });
    }
    fetchStreamingAmount(withdrawDataAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.program.account.streaming.fetch(withdrawDataAccount);
            return response;
        });
    }
}
exports.ZebecNativeStream = ZebecNativeStream;
class ZebecTokenStream extends ZebecStream {
    constructor(anchorProvider, feeReceiver, logger = false) {
        super(anchorProvider, feeReceiver, logger);
        this.console.info("zebec token stream object is initialized!!!");
    }
    init(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, token_mint_address, start_time, end_time, amount } = data;
            this.console.info(`init token stream data: }`, data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawEscrowAccountAddress,] = yield this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
            const escrowAccountKeypair = web3_js_1.Keypair.generate();
            const amountInLamports = yield (0, utils_1.getTokenAmountInLamports)(amount, tokenMintAddress, this.program);
            const anchorTx = yield this.transactionBuilder.execStreamInitToken(escrowAccountKeypair, withdrawEscrowAccountAddress, this.feeReceiverAddress, feeVaultAddress, feeVaultDataAddress, senderAddress, receiverAddress, tokenMintAddress, start_time, end_time, amountInLamports);
            const tx = yield this._makeTxn(anchorTx, escrowAccountKeypair);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `token stream started.`,
                    data: {
                        transactionHash: signature,
                        pda: escrowAccountKeypair.publicKey.toString()
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    pause(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow } = data;
            this.console.info(`pause token stream data: }`, data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const anchorTx = yield this.transactionBuilder.execStreamPauseToken(senderAddress, receiverAddress, escrowAccountAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `token stream paused`,
                    data: {
                        transactionHash: signature,
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    resume(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow } = data;
            this.console.info(`resume token stream data: }`, data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const anchorTx = yield this.transactionBuilder.execStreamPauseToken(senderAddress, receiverAddress, escrowAccountAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `token stream resumed`,
                    data: {
                        transactionHash: signature,
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    cancel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, escrow, token_mint_address } = data;
            this.console.info(`cancel token stream data: }`, data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawEscrowDataAccountAddress,] = yield this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
            const [zebecVaultAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const [receiverAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);
            const [feeVaultAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(feeVaultAddress, tokenMintAddress);
            const anchorTx = yield this.transactionBuilder.execStreamCancelToken(senderAddress, receiverAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, receiverAssociatedTokenAddress, feeVaultAssociatedTokenAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `token stream canceled`,
                    data: {
                        transactionHash: signature,
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    withdraw(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, token_mint_address, escrow } = data;
            this.console.info("withdraw token stream data: ", data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const escrowAccountAddress = new web3_js_1.PublicKey(escrow);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [withdrawEscrowAccountAddress,] = yield this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
            const [feeVaultAddress,] = yield this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = yield this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [zebecVaultAssociatedAccountAddress,] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const [receiverAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);
            const [feeVaultAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(feeVaultAddress, tokenMintAddress);
            const anchorTx = yield this.transactionBuilder.execStreamWithdrawToken(receiverAddress, senderAddress, this.feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, zebecVaultAddress, escrowAccountAddress, withdrawEscrowAccountAddress, tokenMintAddress, zebecVaultAssociatedAccountAddress, receiverAssociatedTokenAddress, feeVaultAssociatedTokenAddress);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `withdraw successful`,
                    data: {
                        transactionHash: signature,
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    instantTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sender, receiver, token_mint_address, amount } = data;
            this.console.info("token instant transfer: ", data);
            const senderAddress = new web3_js_1.PublicKey(sender);
            const receiverAddress = new web3_js_1.PublicKey(receiver);
            const tokenMintAddress = new web3_js_1.PublicKey(token_mint_address);
            const amountInLamports = yield (0, utils_1.getTokenAmountInLamports)(amount, tokenMintAddress, this.program);
            const [zebecVaultAddress,] = yield this._findZebecVaultAccount(senderAddress);
            const [withdrawEscrowDataAccountAddress,] = yield this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
            const [zebecVaultAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
            const [receiverAssociatedTokenAddress,] = yield this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);
            const anchorTx = yield this.transactionBuilder.execInstantTokenTransfer(zebecVaultAddress, receiverAddress, senderAddress, withdrawEscrowDataAccountAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, receiverAssociatedTokenAddress, amountInLamports);
            const tx = yield this._makeTxn(anchorTx);
            const signedRawTx = yield this.anchorProvider.wallet.signTransaction(tx);
            this.console.info("transaction after signing: ", signedRawTx);
            try {
                const signature = yield (0, utils_1.sendTx)(signedRawTx, this.anchorProvider);
                this.console.info(`transaction success, TXID: ${signature}`);
                return {
                    status: "success",
                    message: `token instant transfer successful`,
                    data: {
                        transactionHash: signature,
                    }
                };
            }
            catch (err) {
                return {
                    status: "error",
                    message: (0, utils_1.parseErrorMessage)(err.message),
                    data: null
                };
            }
        });
    }
    fetchStreamingAmount(withdrawDataAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.program.account.streaming.fetch(withdrawDataAccount);
            return response;
        });
    }
}
exports.ZebecTokenStream = ZebecTokenStream;

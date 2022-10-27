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
exports.getTxSize = exports.ConsoleLog = exports.initAnchorProvider = exports.sleep = exports.now = exports.getClusterTime = exports.getAmountInBN = exports.getTokenAmountInLamports = exports.getAmountInLamports = exports.sendTx = exports.parseErrorMessage = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const idl_1 = require("../idl");
const parseErrorMessage = (message) => {
    const regex = /error: 0x(.*)/gm;
    const errors = idl_1.ZEBEC_MULTISIG_PROGRAM_IDL.errors;
    let m, errcode;
    while ((m = regex.exec(message)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        if (m.length > 1) {
            errcode = parseInt(m[1], 16);
        }
    }
    const errObj = errors.find(e => e.code === errcode);
    if (errcode && errObj) {
        return errObj.msg.toLowerCase();
    }
    return message;
};
exports.parseErrorMessage = parseErrorMessage;
const getErrorForTransaction = (connection, txid) => __awaiter(void 0, void 0, void 0, function* () {
    const commitment = "finalized";
    const latestBlockhash = yield connection.getLatestBlockhash(commitment);
    yield connection.confirmTransaction(Object.assign({ signature: txid }, latestBlockhash), commitment);
    const tx = yield connection.getParsedTransaction(txid, commitment);
    console.log("parsed transaction: ", tx);
    const errors = [];
    if ((tx === null || tx === void 0 ? void 0 : tx.meta) && tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log) => {
            const regex = /Error: (.*)/gm;
            let m;
            while ((m = regex.exec(log)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (m.length > 1) {
                    errors.push(m[1]);
                }
            }
        });
    }
    return errors;
});
const sendTx = (tx, provider) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("------ sending transaction --------", tx);
    const connection = provider.connection;
    const rawTxn = tx.serialize();
    let options = {
        skipPreflight: false,
        commitment: provider.connection.commitment
    };
    const startTime = (0, exports.now)();
    let done = false;
    const retryTimeout = 3000;
    const txid = yield connection.sendRawTransaction(rawTxn, options);
    (() => __awaiter(void 0, void 0, void 0, function* () {
        while (!done && (0, exports.now)() - startTime < retryTimeout) {
            connection.sendRawTransaction(rawTxn, options);
            console.log("retry sending transaction continuously every 2 seconds...", txid);
            yield sleep(2000);
        }
    }))();
    let status;
    try {
        const signatureResult = yield connection.confirmTransaction({
            signature: txid,
            blockhash: tx.recentBlockhash,
            lastValidBlockHeight: tx.lastValidBlockHeight
        }, provider.connection.commitment);
        status = signatureResult.value;
    }
    catch (error) {
        status = {
            err: error
        };
    }
    finally {
        done = true;
    }
    console.log("status: ", status);
    if (status === null || status === void 0 ? void 0 : status.err) {
        let errors = [];
        if (status.err.message &&
            (status.err.message.includes("block height exceeded") ||
                status.err.message.includes("timeout exceeded"))) {
            errors = [status.err.message];
        }
        else {
            errors = yield getErrorForTransaction(connection, txid);
        }
        throw new Error(`Raw transaction ${txid} faied (${JSON.stringify(status)})`);
    }
    return txid;
});
exports.sendTx = sendTx;
const getAmountInLamports = (amount) => {
    return amount * web3_js_1.LAMPORTS_PER_SOL;
};
exports.getAmountInLamports = getAmountInLamports;
const getTokenAmountInLamports = (amount, tokenMintAddress, program) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const connection = program.provider.connection;
    const tokenMetaData = yield connection.getTokenSupply(tokenMintAddress);
    const decimals = (_a = tokenMetaData.value) === null || _a === void 0 ? void 0 : _a.decimals;
    return amount * Math.pow(10, decimals);
});
exports.getTokenAmountInLamports = getTokenAmountInLamports;
const getAmountInBN = (amount) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenBalanceResponse = amount.toLocaleString("fullwide", { useGrouping: false });
    const amountBN = yield new anchor_1.BN(tokenBalanceResponse);
    return amountBN;
});
exports.getAmountInBN = getAmountInBN;
const getClusterTime = (provider) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedClock = yield provider.connection.getParsedAccountInfo(web3_js_1.SYSVAR_CLOCK_PUBKEY);
    const parsedClockAccount = parsedClock.value.data.parsed;
    const clusterTimestamp = parsedClockAccount.info.unixTimestamp;
    return clusterTimestamp;
});
exports.getClusterTime = getClusterTime;
const now = () => {
    return new Date().getTime();
};
exports.now = now;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
const initAnchorProvider = (wallet, rpcUrl, opts) => {
    opts = opts !== null && opts !== void 0 ? opts : anchor_1.AnchorProvider.defaultOptions();
    const connection = new web3_js_1.Connection(rpcUrl !== null && rpcUrl !== void 0 ? rpcUrl : "http://localhost:8899", opts.preflightCommitment);
    const provider = new anchor_1.AnchorProvider(connection, wallet, opts);
    return provider;
};
exports.initAnchorProvider = initAnchorProvider;
class ConsoleLog {
    constructor(logger) {
        this.logger = logger;
    }
    info(message, value = null) {
        if (this.logger && value) {
            console.log(message, value);
        }
        console.log(message);
    }
}
exports.ConsoleLog = ConsoleLog;
const getTxSize = (accounts, owners, isDataVector, data_size) => {
    const vec_discriminator = 8;
    const discriminator = 8;
    const pubkey_size = 32;
    const account_size = vec_discriminator + accounts.length * (32 + 1 + 1);
    let datasize = discriminator + data_size;
    if (isDataVector) {
        datasize = data_size + vec_discriminator;
    }
    const num_owner = owners.length;
    const sig_vec_size = vec_discriminator + num_owner * 1;
    const txSize = discriminator +
        pubkey_size +
        pubkey_size +
        account_size +
        datasize +
        sig_vec_size +
        1 +
        4;
    return txSize;
};
exports.getTxSize = getTxSize;

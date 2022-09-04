"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION_ACCOUNT_SIZE = exports.ZEBEC_STREAM = exports.ZEBEC_PROGRAM_ID = exports.SC_CONSTANT = void 0;
var SC_CONSTANT;
(function (SC_CONSTANT) {
    SC_CONSTANT["PREFIX"] = "withdraw_sol";
    SC_CONSTANT["OPERATE"] = "NewVaultOption";
    SC_CONSTANT["OPERATE_DATA"] = "NewVaultOptionData";
    SC_CONSTANT["PREFIX_TOKEN"] = "withdraw_token";
    SC_CONSTANT["SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID"] = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
})(SC_CONSTANT = exports.SC_CONSTANT || (exports.SC_CONSTANT = {}));
var ZEBEC_PROGRAM_ID;
(function (ZEBEC_PROGRAM_ID) {
    ZEBEC_PROGRAM_ID["MULTISIG"] = "5BU6x2H7WXeyaP75D7daNJQAipZfVUr5FM9zdhzajK6p";
    ZEBEC_PROGRAM_ID["STREAM"] = "Gvg5iMmgu8zs4rn5zJ6YGGnzsu6WqZJawKUndbqneXia";
})(ZEBEC_PROGRAM_ID = exports.ZEBEC_PROGRAM_ID || (exports.ZEBEC_PROGRAM_ID = {}));
var ZEBEC_STREAM;
(function (ZEBEC_STREAM) {
    ZEBEC_STREAM["DEPOSIT_SOL"] = "depositSol";
    ZEBEC_STREAM["INIT_STREAM_SOL"] = "nativeStream";
    ZEBEC_STREAM["PAUSE_STREAM_SOL"] = "pauseStream";
    ZEBEC_STREAM["RESUME_STREAM_SOL"] = "pauseStream";
    ZEBEC_STREAM["UPDATE_STREAM_SOL"] = "nativeStreamUpdate";
    ZEBEC_STREAM["CANCEL_STREAM_SOL"] = "cancelStream";
    ZEBEC_STREAM["INSTANT_TRANSFER_SOL"] = "instantNativeTransfer";
    ZEBEC_STREAM["DEPOSIT_TOKEN"] = "depositToken";
    ZEBEC_STREAM["INIT_STREAM_TOKEN"] = "tokenStream";
    ZEBEC_STREAM["PAUSE_RESUME_STREAM_TOKEN"] = "pauseResumeTokenStream";
    ZEBEC_STREAM["UPDATE_STREAM_TOKEN"] = "tokenStreamUpdate";
    ZEBEC_STREAM["CANCEL_STREAM_TOKEN"] = "cancelTokenStream";
    ZEBEC_STREAM["INSTANT_TRANSFER_TOKEN"] = "instantTokenTransfer";
})(ZEBEC_STREAM = exports.ZEBEC_STREAM || (exports.ZEBEC_STREAM = {}));
var TRANSACTION_ACCOUNT_SIZE;
(function (TRANSACTION_ACCOUNT_SIZE) {
    TRANSACTION_ACCOUNT_SIZE[TRANSACTION_ACCOUNT_SIZE["INIT"] = 1000] = "INIT";
})(TRANSACTION_ACCOUNT_SIZE = exports.TRANSACTION_ACCOUNT_SIZE || (exports.TRANSACTION_ACCOUNT_SIZE = {}));

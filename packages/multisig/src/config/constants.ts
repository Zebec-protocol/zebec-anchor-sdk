
export enum SC_CONSTANT {
    PREFIX = "withdraw_sol",
    OPERATE = "NewVaultOption",
    OPERATE_DATA = "NewVaultOptionData",
    PREFIX_TOKEN = "withdraw_token",
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
}

// ajay pid --> 5BU6x2H7WXeyaP75D7daNJQAipZfVUr5FM9zdhzajK6p

//samundra pid --> b6ZPysThkApNx2YDiGsPUiYPE7Ub1kTRdCWp7gBkzbr

export enum ZEBEC_PROGRAM_ID {
    MULTISIG = "b6ZPysThkApNx2YDiGsPUiYPE7Ub1kTRdCWp7gBkzbr",
    STREAM = "3QR2HYqZPPn4P6Xh2eaujTnQUQRenFeRR8e3by6DZoa1"
}

export enum ZEBEC_STREAM {
    DEPOSIT_SOL = "depositSol",
    INIT_STREAM_SOL = "nativeStream",
    PAUSE_STREAM_SOL = "pauseStream",
    RESUME_STREAM_SOL = "pauseStream",
    UPDATE_STREAM_SOL = "nativeStreamUpdate",
    CANCEL_STREAM_SOL = "cancelStream",
    INSTANT_TRANSFER_SOL = "instantNativeTransfer",
    DIRECT_TRANSFER_SOL = "sendSolDirectly",

    DEPOSIT_TOKEN = "depositToken",
    INIT_STREAM_TOKEN = "tokenStream",
    PAUSE_RESUME_STREAM_TOKEN = "pauseResumeTokenStream",
    UPDATE_STREAM_TOKEN = "tokenStreamUpdate",
    CANCEL_STREAM_TOKEN = "cancelTokenStream",
    INSTANT_TRANSFER_TOKEN = "instantTokenTransfer",
    DIRECT_TRANSFER_TOKEN = "sendTokenDirectly"
}

// EDIT IT LATER
export enum TRANSACTION_ACCOUNT_SIZE {
    INIT = 1000
}

export const STREAM_SIZE = 8 + 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 8+ 8 + 1 + 1;
export const STREAM_TOKEN_SIZE = 8 + 8 + 8 + 8 + 8 + 8 + 32 + 32 + 32 + 8 + 8 + 32 +8+ 8 + 1 + 1;
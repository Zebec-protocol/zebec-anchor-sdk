
export enum SC_CONSTANT {
    PREFIX = "withdraw_sol",
    OPERATE = "NewVaultOption",
    OPERATE_DATA = "NewVaultOptionData",
    PREFIX_TOKEN = "withdraw_token",
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
}

export enum ZEBEC_PROGRAM_ID {
    MULTISIG = "5BU6x2H7WXeyaP75D7daNJQAipZfVUr5FM9zdhzajK6p",
    STREAM = "14NJEfpvoq6PywHdwFhXcfnHTsPUK3cScCaezKBSDWLd"
}

export enum ZEBEC_STREAM {
    DEPOSIT_SOL = "depositSol",
    INIT_STREAM_SOL = "nativeStream",
    PAUSE_STREAM_SOL = "pauseStream",
    RESUME_STREAM_SOL = "pauseStream",
    UPDATE_STREAM_SOL = "nativeStreamUpdate",
    CANCEL_STREAM_SOL = "cancelStream",

    DEPOSIT_TOKEN = "depositToken",
    INIT_STREAM_TOKEN = "tokenStream",
    PAUSE_RESUME_STREAM_TOKEN = "pauseResumeTokenStream",
    UPDATE_STREAM_TOKEN = "tokenStreamUpdate",
    CANCEL_STREAM_TOKEN = "tokenCancel"
}

// EDIT IT LATER
export enum TRANSACTION_ACCOUNT_SIZE {
    INIT = 1000
}
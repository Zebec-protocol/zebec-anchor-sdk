import { web3 } from "@project-serum/anchor";

const { PublicKey } = web3;

export const OPERATE_DATA = "NewVaultOptionData";
export const OPERATE = "NewVaultOption";
export const PREFIX = "withdraw_sol";
export const PREFIX_TOKEN = "withdraw_token";
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

export const ZEBEC_MULTISIG_PROGRAM_ID = new PublicKey(
    "z2cRSCyFZa4e5qGQtwEmLjd5AHU5UANBWqNYiLkBnoJ"
);

export const ZEBEC_STREAM_PROGRAM_ID = new PublicKey(
    "14NJEfpvoq6PywHdwFhXcfnHTsPUK3cScCaezKBSDWLd"
);
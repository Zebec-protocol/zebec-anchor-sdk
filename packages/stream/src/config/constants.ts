import { PublicKey } from '@solana/web3.js'

// constants
export const OPERATE_DATA = 'NewVaultOptionData'
export const OPERATE = 'NewVaultOption'
export const PREFIX = 'withdraw_sol'
export const PREFIX_TOKEN = 'withdraw_token'
export const STREAM_SIZE = 8 + 8 + 8 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 32 + 8+ 8 + 1 + 1;
export const STREAM_TOKEN_SIZE = 8 + 8 + 8 + 8 + 8 + 8 + 32 + 32 + 32 + 8 + 8 + 32 +8+ 8 + 1 + 1;
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'

export const ZEBEC_PROGRAM_ID = new PublicKey('zbcKGdAmXfthXY3rEPBzexVByT2cqRqCZb9NwWdGQ2T')

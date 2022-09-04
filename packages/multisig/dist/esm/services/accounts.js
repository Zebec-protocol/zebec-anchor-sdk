"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountKeys = void 0;
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
class AccountKeys {
    static remainingAccounts(accounts, safeAddress) {
        const remainingAccounts = accounts.map((acc) => {
            if (acc.pubkey.equals(safeAddress)) {
                console.log("safee address signer changed", acc.pubkey.toBase58());
                return Object.assign(Object.assign({}, acc), { isSigner: false });
            }
            return acc;
        }).concat({
            pubkey: new web3_js_1.PublicKey(config_1.ZEBEC_PROGRAM_ID.STREAM),
            isWritable: false,
            isSigner: false
        });
        return remainingAccounts;
    }
    static deposit(zebecVaultAddress, safeAddress) {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false }
        ];
    }
    static depositToken(zebecVaultAddress, safeAddress, tokenMintAddress, zebecVaultAssociatedTokenAddress, pdaTokenData) {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: token_1.ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
            { pubkey: zebecVaultAssociatedTokenAddress, isSigner: false, isWritable: false },
            { pubkey: pdaTokenData, isSigner: false, isWritable: true },
        ];
    }
    static init(streamDataAccountAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress) {
        return [
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false }
        ];
    }
    static pause(safeAddress, receiverAddress, streamDataAccount) {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true }
        ];
    }
    static resume(safeAddress, receiverAddress, streamDataAccount) {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true }
        ];
    }
    static cancel(zebecVaultAddress, safeAddress, receiverAddress, streamDataAccountAddress, withdrawDataAccountAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress) {
        console.log([
            zebecVaultAddress.toString(),
            safeAddress.toString(),
            receiverAddress.toString(),
            streamDataAccountAddress.toString(),
            withdrawDataAccountAddress.toString(),
            feeReceiverAddress.toString(),
            feeVaultDataAddress.toString(),
            feeVaultAddress.toString(),
        ]);
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false }
        ];
    }
    static instanttransfer(zebecVaultAddress, safeAddress, receiverAddress, withdrawDataAccountAddress) {
        console.log([
            zebecVaultAddress.toString(),
            safeAddress.toString(),
            receiverAddress.toString(),
            withdrawDataAccountAddress.toString(),
        ]);
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false }
        ];
    }
    static withdraw(zebecVaultAddress, safeAddress, withdrawDataAccountAddress) {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false }
        ];
    }
    static inittoken(streamDataAccountAddress, withdrawDataAccount, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, safeAddress, receiverAddress, tokenMintAddress) {
        return [
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccount, isSigner: false, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
        ];
    }
    static pausetoken(safeAddress, receiverAddress, streamDataAccount) {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true }
        ];
    }
    static resumetoken(safeAddress, receiverAddress, streamDataAccount) {
        return [
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: receiverAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccount, isSigner: false, isWritable: true }
        ];
    }
    static canceltoken(zebecVaultAddress, receiverAddress, safeAddress, feeReceiverAddress, feeVaultDataAddress, feeVaultAddress, streamDataAccountAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, dest_token_data, fee_token_data) {
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: feeReceiverAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultDataAddress, isSigner: false, isWritable: false },
            { pubkey: feeVaultAddress, isSigner: false, isWritable: false },
            { pubkey: streamDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: token_1.ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
            { pubkey: pdaTokenData, isSigner: false, isWritable: true },
            { pubkey: dest_token_data, isSigner: false, isWritable: true },
            { pubkey: fee_token_data, isSigner: false, isWritable: true },
        ];
    }
    static instanttransfertoken(zebecVaultAddress, receiverAddress, safeAddress, withdrawDataAccountAddress, tokenMintAddress, pdaTokenData, destTokenData) {
        console.log([
            zebecVaultAddress.toString(),
            safeAddress.toString(),
            receiverAddress.toString(),
            withdrawDataAccountAddress.toString(),
        ]);
        return [
            { pubkey: zebecVaultAddress, isSigner: false, isWritable: false },
            { pubkey: receiverAddress, isSigner: false, isWritable: true },
            { pubkey: safeAddress, isSigner: true, isWritable: true },
            { pubkey: withdrawDataAccountAddress, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: token_1.ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: tokenMintAddress, isSigner: false, isWritable: false },
            { pubkey: pdaTokenData, isSigner: false, isWritable: true },
            { pubkey: destTokenData, isSigner: false, isWritable: true },
        ];
    }
}
exports.AccountKeys = AccountKeys;

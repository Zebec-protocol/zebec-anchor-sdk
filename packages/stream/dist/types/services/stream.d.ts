import { AnchorProvider, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ZebecInstructionBuilder } from "../builders";
import { IBaseStream, IZebecStream } from "../interfaces";
import { DepositWithdrawFromZebecVault, InitStream, PauseResumeWithdrawCancel, ZebecResponse } from "../models";
import { TransactionSender } from "./transaction-sender";
declare class ZebecStream implements IBaseStream {
    readonly program: Program;
    readonly programId: PublicKey;
    readonly instructionBuilder: ZebecInstructionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly transactionSender: TransactionSender;
    constructor(anchorProvider: AnchorProvider, feeReceiver: string);
    _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;
    _findFeeVaultDataAccount(feeVaultAddress: PublicKey): Promise<[PublicKey, number]>;
    _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>;
    _findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>;
    depositSolToZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse>;
    withdrawSolFromZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse>;
    depositTokenToZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse>;
    withdrawTokenFromZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse>;
}
export declare class ZebecNativeStream extends ZebecStream implements IZebecStream {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string);
    init(data: InitStream): Promise<ZebecResponse>;
    pause(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
    resume(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
    cancel(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
    withdraw(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
}
export declare class ZebecTokenStream extends ZebecStream implements IZebecStream {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string);
    init(data: InitStream): Promise<ZebecResponse>;
    pause(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
    resume(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
    cancel(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
    withdraw(data: PauseResumeWithdrawCancel): Promise<ZebecResponse>;
}
export {};

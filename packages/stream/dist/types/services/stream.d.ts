import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { ConsoleLog } from './utils';
import { IBaseStream, IZebecStream } from "../interface";
import { ZebecTransactionBuilder } from '../instruction';
import { MDepositWithdrawFromZebecVault, MInitStream, MPauseResumeWithdrawCancel, MZebecResponse, MUpdateStream } from "../models";
declare class ZebecStream implements IBaseStream {
    readonly anchorProvider: AnchorProvider;
    readonly program: Program;
    readonly programId: PublicKey;
    readonly transactionBuilder: ZebecTransactionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly logger: boolean;
    readonly console: ConsoleLog;
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean);
    _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;
    _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;
    _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>;
    _findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>;
    _findStreamingAmountSol(walletAddress: PublicKey): Promise<any>;
    _findStreamingAmountToken(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<any>;
    _makeTxn(tx: Transaction, escrow?: Keypair): Promise<Transaction>;
    createFeeVault(data: any): Promise<MZebecResponse>;
    updateFeeVault(data: any): Promise<MZebecResponse>;
    collectSolFees(): Promise<MZebecResponse>;
    collectTokenFees(data: any): Promise<MZebecResponse>;
    depositSolToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
    withdrawSolFromZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
    depositTokenToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
    withdrawTokenFromZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
}
export declare class ZebecNativeStream extends ZebecStream implements IZebecStream {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger?: boolean);
    init(data: MInitStream): Promise<MZebecResponse>;
    updateStream(data: MUpdateStream): Promise<MZebecResponse>;
    pause(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    instantTransfer(data: any): Promise<MZebecResponse>;
    fetchStreamData(escrow: PublicKey): Promise<any>;
    fetchStreamingAmount(data: any): Promise<any>;
}
export declare class ZebecTokenStream extends ZebecStream implements IZebecStream {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger?: boolean);
    init(data: MInitStream): Promise<MZebecResponse>;
    updateStream(data: MUpdateStream): Promise<MZebecResponse>;
    pause(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>;
    instantTransfer(data: any): Promise<MZebecResponse>;
    fetchStreamData(escrow: PublicKey): Promise<any>;
    fetchStreamingAmount(data: any): Promise<any>;
}
export {};

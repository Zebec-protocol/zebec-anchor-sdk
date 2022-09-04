import { AnchorProvider, Program } from '@project-serum/anchor';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { ZebecTransactionBuilder } from '../instruction';
import { ConsoleLog } from './utils';
export declare class ZebecMultisig {
    readonly anchorProvider: AnchorProvider;
    readonly multisigProgram: Program;
    readonly streamProgram: Program;
    readonly multisigProgramId: PublicKey;
    readonly streamProgramId: PublicKey;
    readonly transactionBuilder: ZebecTransactionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly logger: boolean;
    readonly consolelog: ConsoleLog;
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger?: boolean);
    _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findSafeAddress(walletAddress: PublicKey): Promise<[PublicKey, number]>;
    _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;
    _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;
    _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>;
    _findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>;
    _getAccociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<PublicKey>;
    _fetchTresholdData(stream_data_account: PublicKey): Promise<any>;
    fetchMultiSigStreamData(stream_data_account: PublicKey): Promise<any>;
    _makeTxn(tx: Transaction, escrow?: Keypair[]): Promise<Transaction>;
    createSafe(data: any): Promise<any>;
    createFeeVault(data: any): Promise<any>;
    depositSolToSafe(data: any): Promise<any>;
    depositTokenToSafe(data: any): Promise<any>;
}
export declare class ZebecNativeTreasury extends ZebecMultisig {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger?: boolean);
    deposit(data: any): Promise<any>;
    execDespoit(data: any): Promise<any>;
    init(data: any): Promise<any>;
    execInit(data: any): Promise<any>;
    pause(data: any): Promise<any>;
    execPause(data: any): Promise<any>;
    resume(data: any): Promise<any>;
    execResume(data: any): Promise<any>;
    cancel(data: any): Promise<any>;
    execCancel(data: any): Promise<any>;
    instanttransfer(data: any): Promise<any>;
    execInstanttransfer(data: any): Promise<any>;
    fetchStreamData(stream_data_account: PublicKey): Promise<any>;
}
export declare class ZebecTokenTreasury extends ZebecMultisig {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger?: boolean);
    deposit(data: any): Promise<any>;
    execDespoit(data: any): Promise<any>;
    init(data: any): Promise<any>;
    execInit(data: any): Promise<any>;
    pause(data: any): Promise<any>;
    execPause(data: any): Promise<any>;
    resume(data: any): Promise<any>;
    execResume(data: any): Promise<any>;
    cancel(data: any): Promise<any>;
    execCancel(data: any): Promise<any>;
    instanttransfer(data: any): Promise<any>;
    execInstanttransfer(data: any): Promise<any>;
    fetchStreamData(stream_data_account: PublicKey): Promise<any>;
    withdraw(): Promise<any>;
}

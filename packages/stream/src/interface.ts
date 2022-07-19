import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js'
import { ZebecTransactionBuilder } from './instruction';
import { MInitStream, MDepositWithdrawFromZebecVault, MPauseResumeWithdrawCancel, MStreamResponse, MZebecResponse } from './models'

export interface IBaseStream {

    program: Program;

    programId: PublicKey;

    feeReceiverAddress: PublicKey;

    transactionBuilder: ZebecTransactionBuilder;

    _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;

    _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;

    _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;

    _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>
    
    _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>

    depositSolToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
    
    withdrawSolFromZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
    
    depositTokenToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
    
    withdrawTokenFromZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse>;
}

export interface IZebecStream extends IBaseStream  {

    init(data: MInitStream): Promise<MZebecResponse>

    pause (data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>

    cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>

    resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>

    withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>
}

export interface ITokenZebecStream extends IBaseStream  {

    init(data: MInitStream): Promise<MZebecResponse>

    pause (data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>

    cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>

    resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>

    withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse>
}
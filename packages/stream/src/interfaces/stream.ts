import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js'
import { ZebecInstructionBuilder } from '../instructions/stream';
import { StreamResponse, ZebecResponse } from '../models'
import { TransactionSender } from '../services/transaction-sender';

export interface IBaseStream {

    program: Program;

    programId: PublicKey;

    feeReceiverAddress: PublicKey;

    instructionBuilder: ZebecInstructionBuilder;

    transactionSender: TransactionSender;

    _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>;

    _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;

    _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]>;

    _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]>
    
    _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]>

    depositSolToZebecVault(data: any): Promise<ZebecResponse>;
    
    withdrawSolFromZebecVault(data: any): Promise<ZebecResponse>;
    
    depositTokenToZebecVault(data: any): Promise<ZebecResponse>;
    
    withdrawTokenFromZebecVault(data: any): Promise<ZebecResponse>;

    // ADDD SIGNING AND CONFIRMING INTERFACE????
    // TODO:
    // signAndConfirm(

    // ): Promise<StreamResponse>
}

export interface IZebecStream extends IBaseStream  {

    init(data: any): Promise<ZebecResponse>

    pause (data: any): Promise<ZebecResponse>

    cancel(data: any): Promise<ZebecResponse>

    resume(data: any): Promise<ZebecResponse>

    withdraw(data: any): Promise<ZebecResponse>
}

// export interface ITokenZebecStream extends IStream  {

//     init(data: any): Promise<ZebecResponse>

//     pause (data: any): Promise<ZebecResponse>

//     cancel(data: any): Promise<ZebecResponse>

//     resume(data: any): Promise<ZebecResponse>

//     withdraw(data: any): Promise<ZebecResponse>
// }
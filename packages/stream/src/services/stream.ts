import { Buffer } from 'buffer';
import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { ZEBEC_PROGRAM_IDL } from "../idl";
import { ConsoleLog, getAmountInLamports, getTokenAmountInLamports } from './utils';
import { IBaseStream, IZebecStream } from "../interface";
import { ZebecTransactionBuilder } from '../instruction';
import { OPERATE, OPERATE_DATA, PREFIX, PREFIX_TOKEN, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, ZEBEC_PROGRAM_ID } from "../config/constants";
import { MDepositWithdrawFromZebecVault, MInitStream, MPauseResumeWithdrawCancel, MZebecResponse } from "../models";

// window.Buffer = window.Buffer || require("buffer").Buffer; 

/**
 * ## Base Zebec Stream  
 *
 * Zebec Base Stream object provides a set of helper
 * methods to find various program addresses &
 * instructions to deposit & withdraw from zebec vault.
 * This can be used as follows:
 *
 *
 * [here](https://github.com/Zebec-protocol/zebec-anchor-sdk/blob/master/packages/stream/src/services/stream.ts).
 */
class ZebecStream implements IBaseStream {
    readonly program: Program;
    readonly programId: PublicKey = ZEBEC_PROGRAM_ID;
    readonly transactionBuilder: ZebecTransactionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly logger: boolean;
    readonly console: ConsoleLog;

    constructor (anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean) {
        this.program = new Program(ZEBEC_PROGRAM_IDL as Idl, this.programId, anchorProvider);
        this.transactionBuilder = new ZebecTransactionBuilder(this.program);
        this.feeReceiverAddress = new PublicKey(feeReceiver);
        this.console = new ConsoleLog(logger);
    }

    async _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        const [zebecVaultAddress, nonce] =  await PublicKey.findProgramAddress(
            [walletAddress.toBuffer()],
            this.programId
        );
        this.console.info(`zebec wallet address: ${zebecVaultAddress.toString()}`);
        return [zebecVaultAddress, nonce]
    }

    async _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        const [feeVaultAddress, nonce] = await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(OPERATE)],
            this.programId
        );
        this.console.info(`fee vault address: ${feeVaultAddress.toString()}`);
        return [feeVaultAddress, nonce]
    }

    async _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        const [feeVaultAddress,] = await this._findFeeVaultAddress(feeReceiverAddress);
        const [feeVaultDataAddress, nonce] = await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(OPERATE_DATA), feeVaultAddress.toBuffer()],
            this.programId
        );
        this.console.info(`fee vault data address: ${feeVaultDataAddress}`);
        return [feeVaultDataAddress, nonce]
    }

    async _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        const [withdrawEscrowAccountAddress, nonce] =  await PublicKey.findProgramAddress(
            [Buffer.from(PREFIX), walletAddress.toBuffer()],
            this.programId
        );
        this.console.info(`withdraw-sol escrow account address: ${withdrawEscrowAccountAddress.toString()}`);
        return [withdrawEscrowAccountAddress, nonce]
    }

    async _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]> {
        const [withdrawTokenEscrowAddress, nonce] = await PublicKey.findProgramAddress(
            [Buffer.from(PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()],
            this.programId
        );
        this.console.info(`withdraw-token escrow account address: ${withdrawTokenEscrowAddress}`);
        return [withdrawTokenEscrowAddress, nonce]
    }

    async _findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]> {
        const [associatedTokenAddress, nonce] =  await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            new PublicKey(SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID)
        );
        this.console.info(`associated token address: ${associatedTokenAddress}`);
        return [associatedTokenAddress, nonce]
    }

    async createFeeVault(data: any): Promise<MZebecResponse> {
        const { fee_percentage } = data;

        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);

        this.console.info(`creating fee vault for with ${fee_percentage}%`);

        try {
            const signature = await this.transactionBuilder.execFeeVault(
                this.feeReceiverAddress,
                feeVaultAddress,
                feeVaultDataAddress,
                fee_percentage
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "created fee vault",
                "data": {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: "failed to create fee vault",
                data: null
            }
        }

    }

    async depositSolToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse> {
        
        const { sender, amount } = data;

        this.console.info(`depositing, ${amount} SOL to zebec vault!`);

        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const amountInLamports = getAmountInLamports(amount)
        
        try {
            const signature = await this.transactionBuilder.execDepositSolToZebecWallet(
                senderAddress,
                zebecVaultAddress,
                amountInLamports
            )
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `deposited ${amount} SOL to zebec vault.`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: `failed to deposit ${amount} SOL to zebec vault.`,
                data: null
            }
        }
        

    }

    async withdrawSolFromZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse> {
        const { sender, amount } = data;

        this.console.info(`withdrawing ${amount} SOL fromm zebec vault!`);

        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress, ] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawescrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);
        const amountInLamports = getAmountInLamports(amount);

        try {
            const signature = await this.transactionBuilder.execWithdrawSolFromZebecVault(
                senderAddress,
                zebecVaultAddress,
                withdrawescrowAccountAddress,
                amountInLamports
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `${amount} SOL is withdrawn from zebec vault.`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to withdraw ${amount} SOL from zebec vault.`,
                data: null
            }
        }
    }

    async depositTokenToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse> {
        
        const { sender, token_mint_address, amount } = data;
        this.console.info(`depositing ${amount} to zebec wallet`);
        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);

        const [senderAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
        const [zebecVaultAssocatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.program);

        try {
            const signature = await this.transactionBuilder.execDepositTokenToZebecWallet(
                zebecVaultAddress,
                senderAddress,
                tokenMintAddress,
                senderAssociatedTokenAddress,
                zebecVaultAssocatedAccountAddress,
                amountInLamports
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `${amount} is deposited to zebec vault`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to deposit ${amount} to zebec vault`,
                data: null
            }
        }
    }

    async withdrawTokenFromZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse> {
        const { sender, token_mint_address, amount } = data;
        this.console.info(`withrawing ${amount} from zebec vault`)

        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawescrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
        const [senderAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
        const [zebecVaultAssocatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.program);

        try {
            const signature = await this.transactionBuilder.execWithdrawTokenFromZebecVault(
                senderAddress,
                zebecVaultAddress,
                withdrawescrowAccountAddress,
                tokenMintAddress,
                senderAssociatedTokenAddress,
                zebecVaultAssocatedAccountAddress,
                amountInLamports
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `${amount} is withdrawn from zebec vault`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to withdraw ${amount} from zebec vault`,
                data: null
            }
        }
    }
}

export class ZebecNativeStream extends ZebecStream implements IZebecStream {
    public constructor(
        anchorProvider: AnchorProvider,
        feeReceiver: string,
        logger: boolean = false
    ) {
        super(anchorProvider, feeReceiver, logger);
        this.console.info("zebec native stream object initialized!");
    }

    async init(data: MInitStream): Promise<MZebecResponse> {

        const { sender, receiver, start_time, end_time, amount } = data;
        this.console.info(`sending ${amount} SOL to ${receiver}`);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const [feeVaultAddress, ] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [withdrawEscrowAccountAddress, ] = await this._findSolWithdrawEscrowAccount(senderAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const escrowAccountKeypair = new Keypair();

        const amountInLamports = getAmountInLamports(amount);

        try {
            const signature = await this.transactionBuilder.execStreamInitSol(
                senderAddress,
                receiverAddress,
                escrowAccountKeypair,
                withdrawEscrowAccountAddress,
                this.feeReceiverAddress,
                feeVaultAddress,
                feeVaultDataAddress,
                start_time,
                end_time,
                amountInLamports
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream started. ${amount} SOL`,
                data: {
                    transactionHash: signature,
                    pda: escrowAccountKeypair.publicKey.toString()
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to start stream`,
                data: null
            }
        }
    }

    async pause(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        console.log(`stream pause data:`, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        
        try {
            const signature = await this.transactionBuilder.execStreamPauseSol(
                senderAddress,
                receiverAddress,
                escrowAccountAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream paused`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to pause the stream`,
                data: null
            }
        }
    }

    async resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {
        const { sender, receiver, escrow } = data;

        this.console.info(`resume stream data: ${data}`);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        try {
            const signature = await this.transactionBuilder.execStreamResumeSol(
                senderAddress,
                receiverAddress,
                escrowAccountAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream resumed`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to resume the stream`,
                data: null
            }
        }
    }

    async cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        this.console.info(`cancel stream data: ${data}`);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
        const [withdrawescrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        
        try {
            const signature = await this.transactionBuilder.execStreamCancelSol(
                zebecVaultAddress,
                senderAddress,
                receiverAddress,
                escrowAccountAddress,
                withdrawescrowAccountAddress,
                this.feeReceiverAddress,
                feeVaultDataAddress,
                feeVaultAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream canceled`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to cancel the stream`,
                data: null
            }
        }
    }

    async withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, escrow } = data;

        this.console.info(`withdraw from stream data: ${data}`);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        
        
        try {
            const signature = await this.transactionBuilder.execStreamWithdrawSol(
                senderAddress,
                receiverAddress,
                zebecVaultAddress,
                escrowAccountAddress,
                this.feeReceiverAddress,
                feeVaultAddress,
                feeVaultDataAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            
            return {
                status: "success",
                message: `withdraw completed`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to withdraw the streamed amount`,
                data: null
            }
        }
    }
}

export class ZebecTokenStream extends ZebecStream implements IZebecStream {
    public constructor(
        anchorProvider: AnchorProvider,
        feeReceiver: string,
        logger: boolean = false
    ) {
        super(anchorProvider, feeReceiver, logger);
        this.console.info("zebec token stream object is initialized!!!")
    }

    async init(data: MInitStream): Promise<MZebecResponse> {
        const { sender, receiver, token_mint_address, start_time, end_time, amount, withdraw_limit } = data;

        this.console.info(`init token stream data: ${JSON.stringify(data)}`);
        
        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const [withdrawEscrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const escrowAccountKeypair = Keypair.generate();

        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.program);

        
        try {
            const signature = await this.transactionBuilder.execStreamInitToken(
                escrowAccountKeypair,
                withdrawEscrowAccountAddress,
                this.feeReceiverAddress,
                feeVaultAddress,
                feeVaultDataAddress,
                senderAddress,
                receiverAddress,
                tokenMintAddress,
                start_time,
                end_time,
                amountInLamports,
                withdraw_limit
            );

            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream started.`,
                data: {
                    transactionHash: signature,
                    pda: escrowAccountKeypair.publicKey.toString()
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: `failed to init token stream`,
                data: null
            }
        }
    }

    async pause(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        
        try {
            const signature = await this.transactionBuilder.execStreamPauseToken(
                senderAddress,
                receiverAddress,
                escrowAccountAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream paused`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: `failed to pause token stream`,
                data: null
            }
        }
    }

    async resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        try {
            const signature = await this.transactionBuilder.execStreamPauseToken(
                senderAddress,
                receiverAddress,
                escrowAccountAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream resumed`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: `failed to resume token stream`,
                data: null
            }
        }
    }

    async cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {
        
        const { sender, receiver, escrow, token_mint_address } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const [withdrawEscrowDataAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const [escrowAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(escrowAccountAddress, tokenMintAddress);
        const [receiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(escrowAccountAddress, tokenMintAddress);
        const [feeReceiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(this.feeReceiverAddress, tokenMintAddress);

        try {
            const signature = await this.transactionBuilder.execStreamCancelToken(
                senderAddress,
                receiverAddress,
                this.feeReceiverAddress,
                feeVaultDataAddress,
                feeVaultAddress,
                zebecVaultAddress,
                escrowAccountAddress,
                withdrawEscrowDataAccountAddress,
                tokenMintAddress,
                escrowAssociatedTokenAddress,
                receiverAssociatedTokenAddress,
                feeReceiverAssociatedTokenAddress
            );
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream canceled`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: `failed to cancel token stream`,
                data: null
            }
        }
    }

    async withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, token_mint_address, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawEscrowAccountAddress, ] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress)
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        
        const [zebecVaultAssociatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const [receiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);
        const [feeReceiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(this.feeReceiverAddress, tokenMintAddress);

        try {
            const signature = await this.transactionBuilder.execStreamWithdrawToken(
                receiverAddress,
                senderAddress,
                this.feeReceiverAddress,
                feeVaultDataAddress,
                feeVaultAddress,
                zebecVaultAddress,
                escrowAccountAddress,
                withdrawEscrowAccountAddress,
                tokenMintAddress,
                zebecVaultAssociatedAccountAddress,
                receiverAssociatedTokenAddress,
                feeReceiverAssociatedTokenAddress 
            )
            
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `withdraw successful`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            this.console.error(err);
            return {
                status: "error",
                message: `failed to withdraw from token stream`,
                data: null
            }
        }
    }
}

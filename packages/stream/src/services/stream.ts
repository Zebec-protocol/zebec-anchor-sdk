import { Buffer } from 'buffer';
import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { OPERATE, OPERATE_DATA, PREFIX, PREFIX_TOKEN, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from "../config/constants";
import { ZebecInstructionBuilder } from '../instructions/stream';
import { ZEBEC_PROGRAM_ID } from "../config/program-id";
import { ZEBEC_PROGRAM_IDL } from "../idl";
import { IBaseStream, IZebecStream } from "../interfaces";
import { DepositWithdrawFromZebecVault, InitStream, PauseResumeWithdrawCancel, StreamResponse, ZebecResponse } from "../models";
import { TransactionSender } from "./transaction-sender";

window.Buffer = window.Buffer || require("buffer").Buffer; 

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
    readonly instructionBuilder: ZebecInstructionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly transactionSender: TransactionSender;
    readonly logger: boolean;
    readonly console: Console;

    constructor (anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean = false) {
        this.program = new Program(ZEBEC_PROGRAM_IDL as Idl, this.programId, anchorProvider);
        this.instructionBuilder = new ZebecInstructionBuilder(this.program);
        this.transactionSender = new TransactionSender(anchorProvider);
        this.feeReceiverAddress = new PublicKey(feeReceiver);
        this.console = new Console(logger);
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

    // create fee (set) Vault
    async createfeeVault(data: any): Promise<ZebecResponse> {
        const { fee_percentage } = data;

        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);

        this.console.info(`creating fee vault for with ${fee_percentage}%`);

        const ix = this.instructionBuilder.createSetVaultInstruction(
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress,
            fee_percentage
        );

        const tx = await this.transactionSender.createTxnObj(ix);

        try {
            const signature = await this.transactionSender.sendOne(tx);
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

    async depositSolToZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        
        const { sender, amount } = data;

        this.console.info(`depositing, ${amount} SOL to zebec vault!`);

        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);

        const ix = this.instructionBuilder.createDepositSolToZebecWalletInstruction(
            senderAddress,
            zebecVaultAddress,
            amount
        )

        const tx = await this.transactionSender.createTxnObj({...ix});

        try {
            const signature = await this.transactionSender.sendOne(tx);
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
            // throw error/exception here
            return {
                status: "error",
                message: `failed to deposit ${amount} SOL to zebec vault.`,
                data: null
            }
        }
        

    }

    async withdrawSolFromZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        const { sender, amount } = data;

        this.console.info(`withdrawing ${amount} SOL fromm zebec vault!`);

        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress, ] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawescrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const ix = this.instructionBuilder.createWithdrawSolFromZebecVaultInstruction(
            senderAddress,
            zebecVaultAddress,
            withdrawescrowAccountAddress,
            amount
        )

        const tx = await this.transactionSender.createTxnObj({...ix});

        try {
            const signature = await this.transactionSender.sendOne(tx);
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

    async depositTokenToZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        
        const { sender, token_mint_address, amount } = data;

        this.console.info(`depositing ${amount} to zebec wallet`);

        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);

        const [senderAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
        const [zebecVaultAssocatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);

        const ix = this.instructionBuilder.createDepositTokenToZebecWalletInstruction(
            zebecVaultAddress,
            senderAddress,
            tokenMintAddress,
            senderAssociatedTokenAddress,
            zebecVaultAssocatedAccountAddress,
            amount
        )

        const tx = await this.transactionSender.createTxnObj({...ix});

        try {
            const signature = await this.transactionSender.sendOne(tx);
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

    async withdrawTokenFromZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        const { sender, token_mint_address, amount } = data;
        this.console.info(`withrawing ${amount} from zebec vault`)

        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawescrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
        const [senderAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
        const [zebecVaultAssocatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);

        const ix = this.instructionBuilder.createWithdrawTokenFromZebecVaultInstruction(
            senderAddress,
            zebecVaultAddress,
            withdrawescrowAccountAddress,
            tokenMintAddress,
            senderAssociatedTokenAddress,
            zebecVaultAssocatedAccountAddress,
            amount
        )

        const tx = await this.transactionSender.createTxnObj({...ix});

        try {
            const signature = await this.transactionSender.sendOne(tx);
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
        feeReceiver: string
    ) {
        super(anchorProvider, feeReceiver);
        this.console.info("zebec native stream object initialized!");
    }

    async init(data: InitStream): Promise<ZebecResponse> {

        const { sender, receiver, start_time, end_time, amount } = data;
        this.console.info(`sending ${amount} SOL to ${receiver}`);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const [feeVaultAddress, ] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [withdrawEscrowAccountAddress, ] = await this._findSolWithdrawEscrowAccount(senderAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const escrowAccountKeypair = Keypair.generate();

        const ix = this.instructionBuilder.createStreamInitSolInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountKeypair,
            withdrawEscrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress,
            start_time,
            end_time,
            amount
        )

        const tx = await this.transactionSender.createTxnObj({...ix});

        try {
            const signature = await this.transactionSender.sendOne(tx);
            this.console.info(`transaction success, TXID: ${signature}`);
            
            return {
                status: "success",
                message: `stream started. ${amount} SOL`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            this.console.error(err);
            // throw error/exception here
            return {
                status: "error",
                message: `failed to start the stream`,
                data: null
            }
        }
    }

    async pause(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        this.console.info(`stream pause data: `, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const ix = this.instructionBuilder.createStreamPauseSolInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        )

        const tx = await this.transactionSender.createTxnObj({...ix});
        
        try {
            const signature = await this.transactionSender.sendOne(tx);
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

    async resume(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        const { sender, receiver, escrow } = data;

        this.console.info(`resume stream data: `, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const ix = this.instructionBuilder.createStreamResumeSolInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        );

        const tx = await this.transactionSender.createTxnObj({...ix});
        
        try {
            const signature = await this.transactionSender.sendOne(tx);
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

    async cancel(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        this.console.info(`cancel stream data: `, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
        const [withdrawescrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const ix = this.instructionBuilder.createStreamCancelSolInstruction(
            zebecVaultAddress,
            senderAddress,
            receiverAddress,
            escrowAccountAddress,
            withdrawescrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress
        )

        const tx = await this.transactionSender.createTxnObj({...ix});
        
        try {
            const signature = await this.transactionSender.sendOne(tx);
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

    async withdraw(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {

        const { sender, receiver, escrow } = data;

        this.console.info(`withdraw from stream data: `, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        
        const ix = this.instructionBuilder.createStreamWithdrawSolInstruction(
            senderAddress,
            receiverAddress,
            zebecVaultAddress,
            escrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress
        )

        const tx = await this.transactionSender.createTxnObj({...ix});
        
        try {
            const signature = await this.transactionSender.sendOne(tx);
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
        feeReceiver: string
    ) {
        super(anchorProvider, feeReceiver);
        console.log("Zebec Token Stream object is initialized!!!")
    }

    // init
    async init(data: InitStream): Promise<ZebecResponse> {
        const { sender, receiver, token_mint_address, start_time, end_time, amount, withdraw_limit } = data;
        
        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const [withdrawEscrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const escrowAccountKeypair = Keypair.generate();

        const ix = await this.instructionBuilder.createStreamInitTokenInstruction(
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
            amount,
            withdraw_limit
        )

        // sign and confirm
        
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }
    // pause
    async pause(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {

        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const ix = await this.instructionBuilder.createStreamPauseTokenInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        )

        //sign and confirm

        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }
    // resume
    async resume(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {

        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const ix = await this.instructionBuilder.createStreamPauseTokenInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        )

        // sign and confirm

        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }
    // cancel
    async cancel(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        
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

        const ix = await this.instructionBuilder.createStreamCancelTokenInstruction(
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
        )

        // sign and confirm

        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }
    // withdraw
    async withdraw(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {

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

        const ix = await this.instructionBuilder.createStreamWithdrawTokenInstruction(
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
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }
}

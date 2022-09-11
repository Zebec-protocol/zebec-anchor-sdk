import { Buffer } from 'buffer';
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, Idl, Program, BN } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { ZEBEC_PROGRAM_IDL } from "../idl";
import { ConsoleLog, getAmountInLamports, getTokenAmountInLamports, parseErrorMessage, sendTx } from './utils';
import { IBaseStream, IZebecStream } from "../interface";
import { ZebecTransactionBuilder } from '../instruction';
import { OPERATE, OPERATE_DATA, PREFIX, PREFIX_TOKEN, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, ZEBEC_PROGRAM_ID } from "../config/constants";
import { MDepositWithdrawFromZebecVault, MInitStream, MPauseResumeWithdrawCancel, MZebecResponse, MUpdateStream } from "../models";

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
    readonly anchorProvider: AnchorProvider;
    readonly program: Program;
    readonly programId: PublicKey = ZEBEC_PROGRAM_ID;
    readonly transactionBuilder: ZebecTransactionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly logger: boolean;
    readonly console: ConsoleLog;

    constructor (anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean) {
        this.anchorProvider = anchorProvider;
        this.program = new Program(ZEBEC_PROGRAM_IDL as Idl, this.programId, this.anchorProvider);
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

    async _findStreamingAmountSol(walletAddress: PublicKey): Promise<any> {
        const [withdrawEscrow,] = await this._findSolWithdrawEscrowAccount(walletAddress);
        try{
            const streamingAmount = await this.program.account.solWithdaw.fetch(withdrawEscrow)
            return streamingAmount;
        }
        catch(e) {
            return null;
        }
    }

    async _findStreamingAmountToken(walletAddress: PublicKey, tokenMintAddress:PublicKey): Promise<any> {
        const [withdrawEscrow,] = await this._findTokenWithdrawEscrowAccount(walletAddress, tokenMintAddress);
        try{
            const streamingAmount = await this.program.account.tokenWithdraw.fetch(withdrawEscrow)
            return streamingAmount;
        }
        catch(e) {
            return null;
        }
    }

    async _makeTxn(tx: Transaction, escrow: Keypair = null): Promise<Transaction> {
        this.console.info("---- adding fee payer, blockhash & signing tx ----")
        const latestBlockhash = await this.anchorProvider.connection.getLatestBlockhash(
            this.anchorProvider.connection.commitment
        );
        tx.feePayer = this.anchorProvider.wallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        if (escrow) { tx.partialSign(escrow) };

        return tx
    }

    async createFeeVault(data: any): Promise<MZebecResponse> {
        const { fee_percentage } = data;

        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);

        this.console.info(`creating fee vault for with ${fee_percentage}%`);
        
        const anchorTx = await this.transactionBuilder.execFeeVault(
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress,
            fee_percentage
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "created fee vault",
                "data": {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }

    }

    async collectSolFees(): Promise<MZebecResponse> {

        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);

        const anchorTx = await this.transactionBuilder.execRetrieveSolFees(
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "fee withdraw successful",
                "data": {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async collectTokenFees(data: any): Promise<MZebecResponse> {
        const { token_mint_address } = data;

        const tokenMintAddress = new PublicKey(token_mint_address);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);

        const [feeVaultTokenAccountAddress,] = await this._findAssociatedTokenAddress(feeVaultAddress, tokenMintAddress);
        const [feeOwnerTokenAccountAddress,] = await this._findAssociatedTokenAddress(this.feeReceiverAddress, tokenMintAddress);
        
        const anchorTx = await this.transactionBuilder.execRetrieveTokenFees(
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            tokenMintAddress,
            feeVaultTokenAccountAddress,
            feeOwnerTokenAccountAddress
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "fee withdraw successful",
                "data": {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async depositSolToZebecVault(data: MDepositWithdrawFromZebecVault): Promise<MZebecResponse> {
        
        const { sender, amount } = data;
        this.console.info(`depositing, ${amount} SOL to zebec vault!`);

        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const amountInLamports = getAmountInLamports(amount);
        
        const anchorTx = await this.transactionBuilder.execDepositSolToZebecWallet(
            senderAddress,
            zebecVaultAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `deposited ${amount} SOL to zebec vault.`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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

        const anchorTx = await this.transactionBuilder.execWithdrawSolFromZebecVault(
            senderAddress,
            zebecVaultAddress,
            withdrawescrowAccountAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `${amount} SOL is withdrawn from zebec vault.`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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

        const anchorTx = await this.transactionBuilder.execDepositTokenToZebecWallet(
            zebecVaultAddress,
            senderAddress,
            tokenMintAddress,
            senderAssociatedTokenAddress,
            zebecVaultAssocatedAccountAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);

            return {
                status: "success",
                message: `${amount} is deposited to zebec vault`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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

        const anchorTx = await this.transactionBuilder.execWithdrawTokenFromZebecVault(
            senderAddress,
            zebecVaultAddress,
            withdrawescrowAccountAddress,
            tokenMintAddress,
            senderAssociatedTokenAddress,
            zebecVaultAssocatedAccountAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);

            return {
                status: "success",
                message: `${amount} is withdrawn from zebec vault`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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
        const escrowAccountKeypair = Keypair.generate();

        const amountInLamports = getAmountInLamports(amount);

        const anchorTx = await this.transactionBuilder.execStreamInitSol(
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

        const tx = await this._makeTxn(anchorTx, escrowAccountKeypair);
        
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream started. ${amount} SOL`,
                data: {
                    transactionHash: signature,
                    pda: escrowAccountKeypair.publicKey.toString(),
                    withdrawescrow: withdrawEscrowAccountAddress.toString(),
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async updateStream(data: MUpdateStream): Promise<MZebecResponse> {

        const { sender, receiver, start_time, end_time, amount, escrow } = data;
        this.console.info(`sending ${amount} SOL to ${receiver}`);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const [withdrawEscrowAccountAddress, ] = await this._findSolWithdrawEscrowAccount(senderAddress);
        const escrowAccountPublicKey = new PublicKey(escrow);

        const amountInLamports = getAmountInLamports(amount);

        const anchorTx = await this.transactionBuilder.execStreamUpdateSol(
            escrowAccountPublicKey,
            withdrawEscrowAccountAddress,
            senderAddress,
            receiverAddress,
            start_time,
            end_time,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream updated. ${amount} SOL`,
                data: {
                    transactionHash: signature,
                    withdrawescrow: withdrawEscrowAccountAddress.toString(),
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async pause(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        this.console.info(`stream pause data:`, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const anchorTx = await this.transactionBuilder.execStreamPauseSol(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        );

        const tx = await this._makeTxn(anchorTx);

        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);
        
        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream paused`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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
        
        const anchorTx = await this.transactionBuilder.execStreamResumeSol(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);
        
        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream resumed`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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

        const anchorTx = await this.transactionBuilder.execStreamCancelSol(
            zebecVaultAddress,
            senderAddress,
            receiverAddress,
            escrowAccountAddress,
            withdrawescrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `stream canceled`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
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
        const [withdrawEscrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const anchorTx = await this.transactionBuilder.execStreamWithdrawSol(
            senderAddress,
            receiverAddress,
            zebecVaultAddress,
            escrowAccountAddress,
            withdrawEscrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);
        
        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            
            return {
                status: "success",
                message: `withdraw completed`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async instantTransfer(data: any): Promise<MZebecResponse> {

        const { sender, receiver, amount } = data;
        this.console.info("instant token transfer: ", data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const amountInLamports = getAmountInLamports(amount);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawEscrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const anchorTx = await this.transactionBuilder.execInstantSolTransfer(
            zebecVaultAddress,
            senderAddress,
            receiverAddress,
            withdrawEscrowAccountAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);
        
        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            
            return {
                status: "success",
                message: `transfer completed`,
                data: {
                    transactionHash: signature
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async fetchStreamData(escrow: PublicKey): Promise<any> {
        const response = await this.program.account.stream.fetch(escrow)
        return response
      }

      async fetchStreamingAmount(data:any): Promise<any> {
        const { sender } = data;
        const senderAddress = new PublicKey(sender);
        const response = await this._findStreamingAmountSol(senderAddress);
        const nostreamingAmount = {'amount':new BN(0)}
        if(!response) {
          return nostreamingAmount;
        }
        else {
          return response;
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
        const { sender, receiver, token_mint_address, start_time, end_time, amount } = data;
        this.console.info(`init token stream data: }`, data);
        
        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const [withdrawEscrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const escrowAccountKeypair = Keypair.generate();

        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.program);

        const anchorTx = await this.transactionBuilder.execStreamInitToken(
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
            amountInLamports
        );
        const tx = await this._makeTxn(anchorTx, escrowAccountKeypair);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        
        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
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
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async updateStream(data: MUpdateStream): Promise<MZebecResponse> {
        const { sender, receiver, token_mint_address, start_time, end_time, amount, escrow } = data;
        this.console.info(`init token stream data: }`, data);
        
        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [withdrawEscrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const escrowAccountPublicKey = new PublicKey(escrow);

        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.program);

        const anchorTx = await this.transactionBuilder.execUpdateStreamInitToken(
            escrowAccountPublicKey,
            withdrawEscrowAccountAddress,
            senderAddress,
            receiverAddress,
            tokenMintAddress,
            start_time,
            end_time,
            amountInLamports
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        
        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream updated.`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async pause(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, escrow } = data;
        this.console.info(`pause token stream data: }`, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const anchorTx = await this.transactionBuilder.execStreamPauseToken(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream paused`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async resume(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, escrow } = data;
        this.console.info(`resume token stream data: }`, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const anchorTx = await this.transactionBuilder.execStreamPauseToken(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream resumed`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async cancel(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {
        
        const { sender, receiver, escrow, token_mint_address } = data;
        this.console.info(`cancel token stream data: }`, data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const [withdrawEscrowDataAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const [zebecVaultAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const [receiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);
        const [feeVaultAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(feeVaultAddress, tokenMintAddress);

        const anchorTx = await this.transactionBuilder.execStreamCancelToken(
            senderAddress,
            receiverAddress,
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            zebecVaultAddress,
            escrowAccountAddress,
            withdrawEscrowDataAccountAddress,
            tokenMintAddress,
            zebecVaultAssociatedTokenAddress,
            receiverAssociatedTokenAddress,
            feeVaultAssociatedTokenAddress
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token stream canceled`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async withdraw(data: MPauseResumeWithdrawCancel): Promise<MZebecResponse> {

        const { sender, receiver, token_mint_address, escrow } = data;
        this.console.info("withdraw token stream data: ", data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawEscrowAccountAddress, ] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        
        const [zebecVaultAssociatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const [receiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);
        const [feeVaultAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(feeVaultAddress, tokenMintAddress);

        const anchorTx = await this.transactionBuilder.execStreamWithdrawToken(
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
            feeVaultAssociatedTokenAddress 
        );
        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `withdraw successful`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async instantTransfer(data: any): Promise<MZebecResponse> {
        const { sender, receiver, token_mint_address, amount } = data;
        this.console.info("token instant transfer: ", data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const tokenMintAddress = new PublicKey(token_mint_address);

        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.program);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawEscrowDataAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
        const [zebecVaultAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const [receiverAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(receiverAddress, tokenMintAddress);


        const anchorTx = await this.transactionBuilder.execInstantTokenTransfer(
            zebecVaultAddress,
            receiverAddress,
            senderAddress,
            withdrawEscrowDataAccountAddress,
            tokenMintAddress,
            zebecVaultAssociatedTokenAddress,
            receiverAssociatedTokenAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.console.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.console.info(`transaction success, TXID: ${signature}`);
            return {
                status: "success",
                message: `token instant transfer successful`,
                data: {
                    transactionHash: signature,
                }
            }
        } catch (err) {
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async fetchStreamData(escrow: PublicKey): Promise<any> {
        const response = await this.program.account.streamToken.fetch(escrow)
        return response
      }

      async fetchStreamingAmount(data:any): Promise<any> {
        const { sender, token_mint_address} = data;
        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const response = await this._findStreamingAmountToken(senderAddress,tokenMintAddress);
        const nostreamingAmount = {'amount':new BN(0)}
        if(!response) {
          return nostreamingAmount;
        }
        else {
          return response;
        }
    }
}

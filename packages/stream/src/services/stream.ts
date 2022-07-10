import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ZebecInstructionBuilder } from "../builders";
import { OPERATE, OPERATE_DATA, PREFIX, PREFIX_TOKEN, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from "../config/constants";
import { ZEBEC_PROGRAM_ID } from "../config/program-id";
import { ZEBEC_PROGRAM_IDL } from "../idl";
import { IBaseStream, IZebecStream } from "../interfaces";
import { DepositWithdrawFromZebecVault, InitStream, PauseResumeWithdrawCancel, StreamResponse, ZebecResponse } from "../models";
import { TransactionSender } from "./transaction-sender";


class ZebecStream implements IBaseStream {
    readonly program: Program;
    readonly programId: PublicKey = ZEBEC_PROGRAM_ID;
    readonly instructionBuilder: ZebecInstructionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly transactionSender: TransactionSender;

    constructor (anchorProvider: AnchorProvider, feeReceiver: string) {
        this.program = new Program(ZEBEC_PROGRAM_IDL as Idl, this.programId, anchorProvider);
        this.instructionBuilder = new ZebecInstructionBuilder(this.program);
        this.transactionSender = new TransactionSender(anchorProvider);
        this.feeReceiverAddress = new PublicKey(feeReceiver)
    }

    async _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [walletAddress.toBuffer()],
            this.programId
        )
    }

    async _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(OPERATE)],
            this.programId
        )
    }

    async _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        const [feeVaultAddress,] = await this._findFeeVaultAddress(feeReceiverAddress);

        return await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(OPERATE_DATA), feeVaultAddress.toBuffer()],
            this.programId
        )
    }

    async _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [Buffer.from(PREFIX), walletAddress.toBuffer()],
            this.programId
        )
    }

    async _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [Buffer.from(PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()],
            this.programId
        )
    }

    async _findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            new PublicKey(SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID)
        )
    }

    async depositSolToZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        const { sender, amount } = data;
        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);

        const ix = this.instructionBuilder.createDepositSolToZebecWalletInstruction(
            senderAddress,
            zebecVaultAddress,
            amount
        )
        // confirm transaction
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }

    async withdrawSolFromZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        const { sender, amount } = data;

        const senderAddress = new PublicKey(sender);
        const [zebecVaultAddress, ] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawescrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const ix = await this.instructionBuilder.createWithdrawSolFromZebecVaultInstruction(
            senderAddress,
            zebecVaultAddress,
            withdrawescrowAccountAddress,
            amount
        )

        // send and confirm
        
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }

    async depositTokenToZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        
        const { sender, token_mint_address, amount } = data;

        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);

        const [senderAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
        const [zebecVaultAssocatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);

        const ix = await this.instructionBuilder.createDepositTokenToZebecWalletInstruction(
            zebecVaultAddress,
            senderAddress,
            tokenMintAddress,
            senderAssociatedTokenAddress,
            zebecVaultAssocatedAccountAddress,
            amount
        )

        // confirm the transaction
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }

    async withdrawTokenFromZebecVault(data: DepositWithdrawFromZebecVault): Promise<ZebecResponse> {
        const { sender, token_mint_address, amount } = data;

        const senderAddress = new PublicKey(sender);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawescrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);
        const [senderAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(senderAddress, tokenMintAddress);
        const [zebecVaultAssocatedAccountAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);

        const ix = await this.instructionBuilder.createWithdrawTokenFromZebecVaultInstruction(
            senderAddress,
            zebecVaultAddress,
            withdrawescrowAccountAddress,
            tokenMintAddress,
            senderAssociatedTokenAddress,
            zebecVaultAssocatedAccountAddress,
            amount
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

export class ZebecNativeStream extends ZebecStream implements IZebecStream {
    public constructor(
        anchorProvider: AnchorProvider,
        feeReceiver: string
    ) {
        super(anchorProvider, feeReceiver);
        console.log("Zebec Native Stream object is intialized!!!");
    }

    async init(data: InitStream): Promise<ZebecResponse> {

        const { sender, receiver, start_time, end_time, amount } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const [feeVaultAddress, ] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [withdrawEscrowAccountAddress, ] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const escrowAccountKeypair = Keypair.generate()

        let instructions = [];

        const ix = await this.instructionBuilder.createStreamInitSolInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountKeypair,
            withdrawEscrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultAddress,
            start_time,
            end_time,
            amount
        )

        instructions.push(ix)

        const tx = await this.transactionSender.sendWithWallet({instructions})

        // confirm the transaction and sign from wallet
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: tx
            }
        }
    }

    async pause(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const ix = await this.instructionBuilder.createStreamPauseSolInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        )
        // confirm
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }

    async resume(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const ix = await this.instructionBuilder.createStreamResumeSolInstruction(
            senderAddress,
            receiverAddress,
            escrowAccountAddress
        )

        // confirm

        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }

    async cancel(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {
        
        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
        const [withdrawescrowAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);

        const ix = await this.instructionBuilder.createStreamCancelSolInstruction(
            zebecVaultAddress,
            senderAddress,
            receiverAddress,
            escrowAccountAddress,
            withdrawescrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress
        )

        // confirm and sign
        
        return {
            status: "success",
            message: "hello world",
            data: {
                transactionHash: "string"
            }
        }
    }

    async withdraw(data: PauseResumeWithdrawCancel): Promise<ZebecResponse> {

        const { sender, receiver, escrow } = data;

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const escrowAccountAddress = new PublicKey(escrow);

        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        
        const ix = await this.instructionBuilder.createStreamWithdrawSolInstruction(
            senderAddress,
            receiverAddress,
            zebecVaultAddress,
            escrowAccountAddress,
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress
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

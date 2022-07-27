import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { OPERATE, OPERATE_DATA, PREFIX, ZEBEC_MULTISIG_PROGRAM_ID, ZEBEC_STREAM_PROGRAM_ID } from "../config";
import { ZEBEC_MULTISIG_PROGRAM_IDL, ZEBEC_STREAM_PROGRAM_IDL } from "../idl";
import { ZebecTransactionBuilder } from "../instruction";
import { ConsoleLog, getAmountInLamports, parseErrorMessage, sendTx } from "./utils";



export class ZebecMultisig {
    readonly anchorProvider: AnchorProvider;
    readonly multisigProgram: Program;
    readonly streamProgram: Program;
    readonly multisigProgramId: PublicKey = ZEBEC_MULTISIG_PROGRAM_ID;
    readonly streamProgramId: PublicKey = ZEBEC_STREAM_PROGRAM_ID
    readonly transactionBuilder: ZebecTransactionBuilder;
    readonly feeReceiverAddress: PublicKey;
    readonly logger: boolean;
    readonly consolelog: ConsoleLog;

    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean = false) {
        this.anchorProvider = anchorProvider;
        this.multisigProgram = new Program(ZEBEC_MULTISIG_PROGRAM_IDL as Idl, this.multisigProgramId, this.anchorProvider);
        this.streamProgram = new Program(ZEBEC_STREAM_PROGRAM_IDL as Idl, this.streamProgramId, this.anchorProvider);
        this.transactionBuilder = new ZebecTransactionBuilder(this.multisigProgram, this.streamProgram);
        this.feeReceiverAddress = new PublicKey(feeReceiver);
        this.logger = logger;
        this.consolelog = new ConsoleLog(this.logger);
    }

    async _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        const [zebecVaultAddress, nonce] =  await PublicKey.findProgramAddress(
            [walletAddress.toBuffer()],
            this.streamProgramId
        );
        this.consolelog.info(`zebec wallet address: ${zebecVaultAddress.toString()}`);
        return [zebecVaultAddress, nonce]
    }

    async _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        const [withdrawEscrowAccountAddress, nonce] =  await PublicKey.findProgramAddress(
            [Buffer.from(PREFIX), walletAddress.toBuffer()],
            this.streamProgram.programId
        );
        this.consolelog.info(`withdraw-sol escrow account address: ${withdrawEscrowAccountAddress.toString()}`);
        return [withdrawEscrowAccountAddress, nonce]
    }

    async _findSafeAddress(walletAddress: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [walletAddress.toBuffer()],
            this.multisigProgramId
        )
    }

    async _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        const [feeVaultAddress, nonce] = await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(OPERATE)],
            this.streamProgramId
        );
        this.consolelog.info(`fee vault address: ${feeVaultAddress.toString()}`);
        return [feeVaultAddress, nonce]
    }

    async _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        const [feeVaultAddress,] = await this._findFeeVaultAddress(feeReceiverAddress);
        const [feeVaultDataAddress, nonce] = await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(OPERATE_DATA), feeVaultAddress.toBuffer()],
            this.streamProgramId
        );
        this.consolelog.info(`fee vault data address: ${feeVaultDataAddress}`);
        return [feeVaultDataAddress, nonce]
    }

    async _makeTxn(tx: Transaction, escrow: Keypair = null): Promise<Transaction> {
        this.consolelog.info("---- adding fee payer, blockhash & signing tx ----")
        const latestBlockhash = await this.anchorProvider.connection.getLatestBlockhash(
            this.anchorProvider.connection.commitment
        );
        tx.feePayer = this.anchorProvider.wallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        if (escrow) { tx.partialSign(escrow) };

        return tx
    }

    // async approveTransaction(
    //     multisigSafeAddress: PublicKey,
    //     zebecAccountAndDataStoringTxAccount: PublicKey,
    //     senderAddress: PublicKey
    // ): Promise<Transaction> {

    //     const tx = await this.multisigProgram.methods.approve().accounts({
    //         multisig: multisigSafeAddress,
    //         transaction: zebecAccountAndDataStoringTxAccount,
    //         owner: senderAddress
    //     }).transaction();

    //     return tx;
    // }

    async executeTransaction(data: any): Promise<any> {

        const { sender, safe_address, safe_data_account, zebec_safe_wallet, zebec_data_account } = data;
        console.log(data);
        const multisigSafeAddress = new PublicKey(safe_address);
        const multisigDataAccount = new PublicKey(safe_data_account);
        const multisigSafeZebecWalletAddress = new PublicKey(zebec_safe_wallet);
        const zebecAccountAndDataStoringTxAccount = new PublicKey(zebec_data_account)

        const anchorTx = await this.transactionBuilder.execTransaction(
            multisigSafeAddress,
            multisigDataAccount,
            multisigSafeZebecWalletAddress,
            zebecAccountAndDataStoringTxAccount
        );

        console.log(anchorTx, "ancor tx")

        // const tx = await this._makeTxn(anchorTx);
        // const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        // this.consolelog.info("transaction after signing: ", signedRawTx);

        // try {
        //     const signature = await sendTx(signedRawTx, this.anchorProvider);
        //     this.consolelog.info(`transaction success, TXID: ${signature}`);
        //     return {
        //         "status": "success",
        //         "message": "transaction executed successfully",
        //         "data": {
        //             transactionHash: signature
        //         }
        //     }
        // } catch (err) {
        //     return {
        //         status: "error",
        //         message: parseErrorMessage(err.message),
        //         data: null
        //     }
        // }
    }

    async createSafe(data: any): Promise<any> {
        const { owners, min_confirmation_required } = data;

        const multisigDataAccount = Keypair.generate();

        const ownerAddresses = owners.map((owner: string) => new PublicKey(owner));
        
        const [multisigSigner, multisigSafeNonce] = await this._findSafeAddress(multisigDataAccount.publicKey);
        
        const anchorTx = await this.transactionBuilder.execCreateSafe(
            multisigDataAccount,
            multisigSafeNonce,
            ownerAddresses,
            min_confirmation_required
        );

        const tx = await this._makeTxn(anchorTx, multisigDataAccount);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "created safe",
                "data": {
                    transactionHash: signature,
                    safe_address: multisigSigner.toBase58(),
                    safe_data_account: multisigDataAccount.publicKey.toBase58()
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

    async createFeeVault(data: any): Promise<any> {
        const { fee_percentage } = data;

        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);

        this.consolelog.info(`creating fee vault for with ${fee_percentage}%`);
        
        const anchorTx = await this.transactionBuilder.execFeeVault(
            this.feeReceiverAddress,
            feeVaultAddress,
            feeVaultDataAddress,
            fee_percentage
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
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

    async depositSolToSafe(data: any): Promise<any> {
       
        const { sender, safe_address, amount } = data;

        console.log("deposit to safe: ", data);

        const senderAddress = new PublicKey(sender);
        const zebecSafeAddress = new PublicKey(safe_address);
        
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const [withdrawEscrowDataAccountAddress,] = await this._findSolWithdrawEscrowAccount(senderAddress);
        
        const amountInLamports = getAmountInLamports(amount);
        
        console.log("senderAddress", senderAddress.toString())
        console.log("zebecVaultAddress", zebecVaultAddress.toString())
        console.log("zebecSafeAddress", zebecSafeAddress.toString())
        console.log("withdrawEscrowDataAccountAddress", withdrawEscrowDataAccountAddress.toString())
        
        
        const anchorTx = await this.transactionBuilder.execDepositSol(
            zebecVaultAddress,
            senderAddress,
            zebecSafeAddress,
            withdrawEscrowDataAccountAddress,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "deposit successful",
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
}

export class ZebecNativeTreasury extends ZebecMultisig {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean=false) {
        super(anchorProvider, feeReceiver, logger);
        this.consolelog.info("zebec native treasury object initialized!")
    }

    async init(data: any): Promise<any> {
        // const { safe_address}
    }
    async pause(): Promise<any> {}
    async resume(): Promise<any> {}
    async withdraw(): Promise<any> {}
    async cancel(): Promise<any> {}
}

export class ZebecTokenTreasury extends ZebecMultisig {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean=false) {
        super(anchorProvider, feeReceiver, logger);
        this.consolelog.info("zebec token treasury object initialized!")
    }

    async init(): Promise<any> {}
    async pause(): Promise<any> {}
    async resume(): Promise<any> {}
    async withdraw(): Promise<any> {}
    async cancel(): Promise<any> {}
}
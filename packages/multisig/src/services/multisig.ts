import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SC_CONSTANT, ZEBEC_PROGRAM_ID } from "../config";
import { ZEBEC_MULTISIG_PROGRAM_IDL, ZEBEC_STREAM_PROGRAM_IDL } from "../idl";
import { ZebecTransactionBuilder } from "../instruction";
import { AccountKeys } from "./accounts";
import { ConsoleLog, getAmountInLamports, getTokenAmountInLamports, parseErrorMessage, sendTx } from "./utils";



export class ZebecMultisig {
    readonly anchorProvider: AnchorProvider;
    readonly multisigProgram: Program;
    readonly streamProgram: Program;
    readonly multisigProgramId: PublicKey = new PublicKey(ZEBEC_PROGRAM_ID.MULTISIG);
    readonly streamProgramId: PublicKey = new PublicKey(ZEBEC_PROGRAM_ID.STREAM)
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
            [Buffer.from(SC_CONSTANT.PREFIX), walletAddress.toBuffer()],
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
            [feeReceiverAddress.toBuffer(), Buffer.from(SC_CONSTANT.OPERATE)],
            this.streamProgramId
        );
        this.consolelog.info(`fee vault address: ${feeVaultAddress.toString()}`);
        return [feeVaultAddress, nonce]
    }

    async _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
        const [feeVaultAddress,] = await this._findFeeVaultAddress(feeReceiverAddress);
        const [feeVaultDataAddress, nonce] = await PublicKey.findProgramAddress(
            [feeReceiverAddress.toBuffer(), Buffer.from(SC_CONSTANT.OPERATE_DATA), feeVaultAddress.toBuffer()],
            this.streamProgramId
        );
        this.consolelog.info(`fee vault data address: ${feeVaultDataAddress}`);
        return [feeVaultDataAddress, nonce]
    }

    async _findTokenWithdrawEscrowAccount(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]> {
        const [withdrawTokenEscrowAddress, nonce] = await PublicKey.findProgramAddress(
            [Buffer.from(SC_CONSTANT.PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()],
            this.streamProgramId
        );
        this.consolelog.info(`withdraw-token escrow account address: ${withdrawTokenEscrowAddress}`);
        return [withdrawTokenEscrowAddress, nonce]
    }

    async _findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<[PublicKey, number]> {
        const [associatedTokenAddress, nonce] =  await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            new PublicKey(SC_CONSTANT.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID)
        );
        this.consolelog.info(`associated token address: ${associatedTokenAddress}`);
        return [associatedTokenAddress, nonce]
    }

    async _makeTxn(tx: Transaction, escrow: Keypair[] = null): Promise<Transaction> {
        this.consolelog.info("---- adding fee payer, blockhash & signing tx ----")
        const latestBlockhash = await this.anchorProvider.connection.getLatestBlockhash(
            this.anchorProvider.connection.commitment
        );
        tx.feePayer = this.anchorProvider.wallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        if (escrow) { tx.partialSign(...escrow) };

        return tx
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

        const tx = await this._makeTxn(anchorTx, [multisigDataAccount]);
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
            throw new Error(parseErrorMessage(err.message))
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
            throw new Error(parseErrorMessage(err.message))
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

    async depositTokenToSafe(data: any): Promise<any> {
        const { sender, safe_address, token_mint_address, amount } = data;

        const senderAddress = new PublicKey(sender);
        const safeAddress = new PublicKey(safe_address);
        const tokenMintAddress = new PublicKey(token_mint_address);
        const [zebecVaultAddress,] = await this._findZebecVaultAccount(senderAddress);
        const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.streamProgram);

        const [zebecVaultAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(zebecVaultAddress, tokenMintAddress);
        const [safeAssociatedTokenAddress,] = await this._findAssociatedTokenAddress(safeAddress, tokenMintAddress);
        const [withdrawEscrowAccountAddress,] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress);

        const anchorTx = await this.transactionBuilder.execDepositToken(
            zebecVaultAddress,
            safeAddress,
            senderAddress,
            withdrawEscrowAccountAddress,
            tokenMintAddress,
            zebecVaultAssociatedTokenAddress,
            safeAssociatedTokenAddress,
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
        
        const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount } = data;
        this.consolelog.info("multisig init stream: ", data);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new PublicKey(receiver);
        const safeAddress = new PublicKey(safe_address);
        const safeDataAccount = new PublicKey(safe_data_account);

        const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const [withdrawDataAccount,] = await this._findSolWithdrawEscrowAccount(safeAddress);

        const streamDataAccount = Keypair.generate();
        const zebecTransactionAccount = Keypair.generate();

        const amountInLamports = getAmountInLamports(amount);

        const anchorTx = await this.transactionBuilder.execInitStream(
            safeAddress,
            safeDataAccount,
            zebecTransactionAccount,
            streamDataAccount,
            withdrawDataAccount,
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            senderAddress,
            receiverAddress,
            start_time,
            end_time,
            amountInLamports
        );

        const tx = await this._makeTxn(anchorTx, [streamDataAccount, zebecTransactionAccount]);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "stream initiated!",
                "data": {
                    transactionHash: signature,
                    stream_data_account: streamDataAccount.publicKey.toString(),
                    transaction_account: zebecTransactionAccount.publicKey.toString(),
                    safe_data_account: safeDataAccount.toString()
                }
            }
        } catch (err) {
            console.log(err.data)
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async execInit(data: any): Promise<any> {
        
        const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver } = data;

        console.log(data);
        
        const receiverAddress = new PublicKey(receiver);
        const streamDataAccountAddress = new PublicKey(stream_data_account);
        const [feeVaultAddress, ] = await this._findFeeVaultAddress(this.feeReceiverAddress);
        const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
        const safeAddress = new PublicKey(safe_address);
        const safeDataAccountAddress = new PublicKey(safe_data_account);
        const initTransactionAccountAddress = new PublicKey(transaction_account);
        // how to automate this transaction, trigger this transaction
        // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
        // what if ownerB exec this function
        const [withdrawDataAccountAddress,] = await this._findSolWithdrawEscrowAccount(safeAddress);
        console.log("withdraw sol data", withdrawDataAccountAddress.toString())
        console.log("feeVaultDataAddress sol data", feeVaultDataAddress.toString())

        const initAccounts =  AccountKeys.init(
            streamDataAccountAddress,
            withdrawDataAccountAddress,
            this.feeReceiverAddress,
            feeVaultDataAddress,
            feeVaultAddress,
            safeAddress,
            receiverAddress,
        );

        const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress);

        const anchorTx = await this.transactionBuilder.execTransaction(
            safeAddress,
            safeDataAccountAddress,
            initTransactionAccountAddress,
            remainingAccounts
        )

        console.log("anchor transaction", anchorTx);

        const tx = await this._makeTxn(anchorTx);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "stream transaction executed!!",
                "data": {
                    transactionHash: signature
                }
            }
        } catch (err) {
            console.log(err)
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }


    }

    async pause(data: any): Promise<any> {

        const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;

        const safeAddress = new PublicKey(safe_address);
        const receiverAddress = new PublicKey(receiver);
        const streamDataAccountAddress = new PublicKey(stream_data_account);
        const safeDataAccount = new PublicKey(safe_data_account);
        const senderAddress = new PublicKey(sender);

        const zebecTransactionAccount = Keypair.generate();
        
        const anchorTx = await this.transactionBuilder.execPauseStream(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress,
            zebecTransactionAccount,
            safeDataAccount,
            senderAddress
        );

        const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount]);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "stream paused!",
                "data": {
                    transactionHash: signature,
                    transaction_account: zebecTransactionAccount.publicKey.toString(),
                }
            }
        } catch (err) {
            console.log(err)
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }

    async resume(data: any): Promise<any> {
        const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;

        const safeAddress = new PublicKey(safe_address);
        const receiverAddress = new PublicKey(receiver);
        const streamDataAccountAddress = new PublicKey(stream_data_account);
        const safeDataAccount = new PublicKey(safe_data_account);
        const senderAddress = new PublicKey(sender);

        const zebecTransactionAccount = Keypair.generate();
        
        const anchorTx = await this.transactionBuilder.execPauseStream(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress,
            zebecTransactionAccount,
            safeDataAccount,
            senderAddress
        );

        const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount]);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "stream resumed!",
                "data": {
                    transactionHash: signature,
                    transaction_account: zebecTransactionAccount.publicKey.toString(),
                }
            }
        } catch (err) {
            console.log(err)
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }


    async fetchStreamData(stream_data_account: PublicKey): Promise<any> {

        const response = await this.streamProgram.account.stream.fetch(
            stream_data_account
        )
        return response
    }
}

export class ZebecTokenTreasury extends ZebecMultisig {
    constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean=false) {
        super(anchorProvider, feeReceiver, logger);
        this.consolelog.info("zebec token treasury object initialized!")
    }

        async init(data:any):Promise<any>{
            const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount , tokenMintAddress } = data;
            this.consolelog.info("multisig init token stream", data);

            const senderAddress = new PublicKey(sender);
            const receiverAddress = new PublicKey(receiver);
            const safeAddress = new PublicKey(safe_address);
            const safeDataAccount = new PublicKey(safe_data_account);

            const [feeVaultAddress,] = await this._findFeeVaultAddress(this.feeReceiverAddress);
            const [feeVaultDataAddress,] = await this._findFeeVaultDataAccount(this.feeReceiverAddress);
            const [withdrawDataAccountAddress,] = await this._findSolWithdrawEscrowAccount(safeAddress);

            const streamDataAccountAddress = Keypair.generate();
            const zebecTransactionAccount = Keypair.generate();

            const anchorTx = await this.transactionBuilder.execStreamInitToken(
                safeAddress,
                safeDataAccount,
                zebecTransactionAccount,
                streamDataAccountAddress,
                withdrawDataAccountAddress,
                this.feeReceiverAddress,
                feeVaultDataAddress,
                feeVaultAddress,
                senderAddress,
                receiverAddress,
                tokenMintAddress,
                start_time,
                end_time,
                amount,
            );

            const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount]);
            const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
            this.consolelog.info("transaction after signing: ", signedRawTx);

            try {
                const signature = await sendTx(signedRawTx, this.anchorProvider);
                this.consolelog.info(`transaction success, TXID: ${signature}`);
                return {
                    "status": "success",
                    "message": "stream initialized!",
                    "data": {
                        transactionHash: signature,
                        transaction_account: zebecTransactionAccount.publicKey.toString(),
                    }
                }
            } catch (err) {
                console.log(err)
                return {
                    status: "error",
                    message: parseErrorMessage(err.message),
                    data: null
                }
            }

        }

    async pause(data: any): Promise<any> {
        const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;

        const safeAddress = new PublicKey(safe_address);
        const receiverAddress = new PublicKey(receiver);
        const streamDataAccountAddress = new PublicKey(stream_data_account);
        const safeDataAccount = new PublicKey(safe_data_account);
        const senderAddress = new PublicKey(sender);

        const zebecTransactionAccount = Keypair.generate();

        const anchorTx = await this.transactionBuilder.execPauseStream(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress,
            zebecTransactionAccount,
            safeDataAccount,
            senderAddress
        );

        const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount]);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "stream paused!",
                "data": {
                    transactionHash: signature,
                    transaction_account: zebecTransactionAccount.publicKey.toString(),
                }
            }
        } catch (err) {
            console.log(err)
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }
    async resume(data: any): Promise<any> {
        const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data;

        const safeAddress = new PublicKey(safe_address);
        const receiverAddress = new PublicKey(receiver);
        const streamDataAccountAddress = new PublicKey(stream_data_account);
        const safeDataAccount = new PublicKey(safe_data_account);
        const senderAddress = new PublicKey(sender);

        const zebecTransactionAccount = Keypair.generate();

        const anchorTx = await this.transactionBuilder.execPauseStream(
            safeAddress,
            receiverAddress,
            streamDataAccountAddress,
            zebecTransactionAccount,
            safeDataAccount,
            senderAddress
        );

        const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount]);
        const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx);
        this.consolelog.info("transaction after signing: ", signedRawTx);

        try {
            const signature = await sendTx(signedRawTx, this.anchorProvider);
            this.consolelog.info(`transaction success, TXID: ${signature}`);
            return {
                "status": "success",
                "message": "stream Resumed!",
                "data": {
                    transactionHash: signature,
                    transaction_account: zebecTransactionAccount.publicKey.toString(),
                }
            }
        } catch (err) {
            console.log(err)
            return {
                status: "error",
                message: parseErrorMessage(err.message),
                data: null
            }
        }
    }
    async withdraw(): Promise<any> {}
    async cancel(): Promise<any> {}
}
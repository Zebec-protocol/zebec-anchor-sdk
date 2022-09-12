import { AnchorProvider, Idl, Program } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token'
import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { SC_CONSTANT, ZEBEC_PROGRAM_ID } from '../config'
import { ZEBEC_MULTISIG_PROGRAM_IDL, ZEBEC_STREAM_PROGRAM_IDL } from '../idl'
import { ZebecTransactionBuilder } from '../instruction'
import { AccountKeys } from './accounts'
import { ConsoleLog, getAmountInLamports, getTokenAmountInLamports, parseErrorMessage, sendTx } from './utils'

export class ZebecMultisig {
  readonly anchorProvider: AnchorProvider
  readonly multisigProgram: Program
  readonly streamProgram: Program
  readonly multisigProgramId: PublicKey = new PublicKey(ZEBEC_PROGRAM_ID.MULTISIG)
  readonly streamProgramId: PublicKey = new PublicKey(ZEBEC_PROGRAM_ID.STREAM)
  readonly transactionBuilder: ZebecTransactionBuilder
  readonly feeReceiverAddress: PublicKey
  readonly logger: boolean
  readonly consolelog: ConsoleLog

  constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean = false) {
    this.anchorProvider = anchorProvider
    this.multisigProgram = new Program(ZEBEC_MULTISIG_PROGRAM_IDL as Idl, this.multisigProgramId, this.anchorProvider)
    this.streamProgram = new Program(ZEBEC_STREAM_PROGRAM_IDL as Idl, this.streamProgramId, this.anchorProvider)
    this.transactionBuilder = new ZebecTransactionBuilder(this.multisigProgram, this.streamProgram)
    this.feeReceiverAddress = new PublicKey(feeReceiver)
    this.logger = logger
    this.consolelog = new ConsoleLog(this.logger)
  }

  async _findZebecVaultAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
    const [zebecVaultAddress, nonce] = await PublicKey.findProgramAddress(
      [walletAddress.toBuffer()],
      this.streamProgramId
    )
    this.consolelog.info(`zebec wallet address: ${zebecVaultAddress.toString()}`)
    return [zebecVaultAddress, nonce]
  }

  async _findSolWithdrawEscrowAccount(walletAddress: PublicKey): Promise<[PublicKey, number]> {
    const [withdrawEscrowAccountAddress, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(SC_CONSTANT.PREFIX), walletAddress.toBuffer()],
      this.streamProgram.programId
    )
    this.consolelog.info(`withdraw-sol escrow account address: ${withdrawEscrowAccountAddress.toString()}`)
    return [withdrawEscrowAccountAddress, nonce]
  }

  async _findSafeAddress(walletAddress: PublicKey): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress([walletAddress.toBuffer()], this.multisigProgramId)
  }

  async _findFeeVaultAddress(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
    const [feeVaultAddress, nonce] = await PublicKey.findProgramAddress(
      [feeReceiverAddress.toBuffer(), Buffer.from(SC_CONSTANT.OPERATE)],
      this.streamProgramId
    )
    this.consolelog.info(`fee vault address: ${feeVaultAddress.toString()}`)
    return [feeVaultAddress, nonce]
  }

  async _findFeeVaultDataAccount(feeReceiverAddress: PublicKey): Promise<[PublicKey, number]> {
    const [feeVaultAddress] = await this._findFeeVaultAddress(feeReceiverAddress)
    const [feeVaultDataAddress, nonce] = await PublicKey.findProgramAddress(
      [feeReceiverAddress.toBuffer(), Buffer.from(SC_CONSTANT.OPERATE_DATA), feeVaultAddress.toBuffer()],
      this.streamProgramId
    )
    this.consolelog.info(`fee vault data address: ${feeVaultDataAddress}`)
    return [feeVaultDataAddress, nonce]
  }

  async _findTokenWithdrawEscrowAccount(
    walletAddress: PublicKey,
    tokenMintAddress: PublicKey
  ): Promise<[PublicKey, number]> {
    const [withdrawTokenEscrowAddress, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(SC_CONSTANT.PREFIX_TOKEN), walletAddress.toBuffer(), tokenMintAddress.toBuffer()],
      this.streamProgramId
    )
    this.consolelog.info(`withdraw-token escrow account address: ${withdrawTokenEscrowAddress}`)
    return [withdrawTokenEscrowAddress, nonce]
  }

  async _findAssociatedTokenAddress(
    walletAddress: PublicKey,
    tokenMintAddress: PublicKey
  ): Promise<[PublicKey, number]> {
    const [associatedTokenAddress, nonce] = await PublicKey.findProgramAddress(
      [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
      new PublicKey(SC_CONSTANT.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID)
    )
    this.consolelog.info(`associated token address: ${associatedTokenAddress}`)
    return [associatedTokenAddress, nonce]
  }

  async _getAccociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<PublicKey> {
    const pdaTokenData = await getAssociatedTokenAddress(
      tokenMintAddress,
      walletAddress,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    return pdaTokenData
  }

  async _fetchTresholdData(safe_data_account: PublicKey): Promise<any> {
    const response = await this.multisigProgram.account.multisig.fetch(safe_data_account)
    return response
  }

  async fetchMultiSigStreamData(stream_data_account: PublicKey): Promise<any> {
    const response = await this.multisigProgram.account.transaction.fetch(stream_data_account)
    return response
  }

  async _makeTxn(tx: Transaction, escrow: Keypair[] = null): Promise<Transaction> {
    this.consolelog.info('---- adding fee payer, blockhash & signing tx ----')
    const latestBlockhash = await this.anchorProvider.connection.getLatestBlockhash(
      this.anchorProvider.connection.commitment
    )
    tx.feePayer = this.anchorProvider.wallet.publicKey
    tx.recentBlockhash = latestBlockhash.blockhash
    tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight
    if (escrow) {
      tx.partialSign(...escrow)
    }

    return tx
  }

  async createSafe(data: any): Promise<any> {
    const { owners, min_confirmation_required } = data

    const multisigDataAccount = Keypair.generate()

    const ownerAddresses = owners.map((owner: string) => new PublicKey(owner))

    const [multisigSigner, multisigSafeNonce] = await this._findSafeAddress(multisigDataAccount.publicKey)

    const [zebecVaultAddress] = await this._findZebecVaultAccount( multisigSigner)

    const anchorTx = await this.transactionBuilder.execCreateSafe(
      multisigDataAccount,
      multisigSafeNonce,
      ownerAddresses,
      min_confirmation_required
    )

    const tx = await this._makeTxn(anchorTx, [multisigDataAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)

      return {
        status: 'success',
        message: 'created safe',
        data: {
          transactionHash: signature,
          safe_address: multisigSigner.toBase58(),
          safe_data_account: multisigDataAccount.publicKey.toBase58(),
          safe_vault_address: zebecVaultAddress.toBase58(),
        }
      }
    } catch (err) {
      throw new Error(parseErrorMessage(err.message))
    }
  }

  async createFeeVault(data: any): Promise<any> {
    const { fee_percentage } = data

    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)

    this.consolelog.info(`creating fee vault for with ${fee_percentage}%`)

    const anchorTx = await this.transactionBuilder.execFeeVault(
      this.feeReceiverAddress,
      feeVaultAddress,
      feeVaultDataAddress,
      fee_percentage
    )

    const tx = await this._makeTxn(anchorTx)
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'created fee vault',
        data: {
          transactionHash: signature
        }
      }
    } catch (err) {
      throw new Error(parseErrorMessage(err.message))
    }
  }

  async depositSolToSafe(data: any): Promise<any> {
    const { sender, safe_address, amount } = data
    const senderAddress = new PublicKey(sender)
    const zebecSafeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(senderAddress)
    const [withdrawEscrowDataAccountAddress] = await this._findSolWithdrawEscrowAccount(senderAddress)

    const amountInLamports = getAmountInLamports(amount)

    const anchorTx = await this.transactionBuilder.execDepositSol(
      zebecVaultAddress,
      senderAddress,
      zebecSafeAddress,
      withdrawEscrowDataAccountAddress,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx)
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'deposit successful',
        data: {
          transactionHash: signature
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async depositTokenToSafe(data: any): Promise<any> {

    const { sender, safe_address, token_mint_address, amount } = data
    const senderAddress = new PublicKey(sender)
    const safeAddress = new PublicKey(safe_address)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(senderAddress)
    const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.streamProgram)

    const [zebecVaultAssociatedTokenAddress] = await this._findAssociatedTokenAddress(
      zebecVaultAddress,
      tokenMintAddress
    )
    const [safeAssociatedTokenAddress] = await this._findAssociatedTokenAddress(safeAddress, tokenMintAddress)
    const [withdrawEscrowAccountAddress] = await this._findTokenWithdrawEscrowAccount(senderAddress, tokenMintAddress)

    const anchorTx = await this.transactionBuilder.execDepositToken(
      zebecVaultAddress,
      safeAddress,
      senderAddress,
      withdrawEscrowAccountAddress,
      tokenMintAddress,
      zebecVaultAssociatedTokenAddress,
      safeAssociatedTokenAddress,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx)
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'deposit successful',
        data: {
          transactionHash: signature
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }
}

export class ZebecNativeTreasury extends ZebecMultisig {
  constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean = false) {
    super(anchorProvider, feeReceiver, logger)
    this.consolelog.info('zebec native treasury object initialized!')
  }

  async deposit(data: any): Promise<any> {

    const { safe_address, safe_data_account, sender, amount } = data
    const senderAddress = new PublicKey(sender)
    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const zebecTransactionAccount = Keypair.generate()
    const amountInLamports = getAmountInLamports(amount)

    const anchorTx = await this.transactionBuilder.execDepositToVault(
      owners,
      zebecVaultAddress,
      safeAddress,
      safeDataAccount,
      zebecTransactionAccount,
      senderAddress,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'Deposited !',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execDespoit(data: any): Promise<any> {
    const { safe_address, safe_data_account, transaction_account, signer } = data
    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const depositAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(depositAccountAddress)
    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers
    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.deposit(zebecVaultAddress, safeAddress)

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        depositAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        depositAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Deposit transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        depositAccountAddress,
        signer
      )

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Deposit transaction Approved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async init(data: any): Promise<any> {

    const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount } = data
    this.consolelog.info('multisig init stream: ', data)
    const senderAddress = new PublicKey(sender)
    const receiverAddress = new PublicKey(receiver)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const [withdrawDataAccount] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const streamDataAccount = Keypair.generate()
    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = getAmountInLamports(amount)

    const anchorTx = await this.transactionBuilder.execInitStream(
      owners,
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
    )

    const tx = await this._makeTxn(anchorTx, [streamDataAccount, zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream initiated!',
        data: {
          transactionHash: signature,
          stream_data_account: streamDataAccount.publicKey.toString(),
          transaction_account: zebecTransactionAccount.publicKey.toString(),
          safe_data_account: safeDataAccount.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execInit(data: any): Promise<any> {
    
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const initTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(initTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })
    const signcheck = obj[signer]

    const initAccounts = AccountKeys.init(
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      this.feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      safeAddress,
      receiverAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        initTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'stream transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'stream transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async updateStream(data: any): Promise<any> {

    const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount, stream_data_account } = data
    this.consolelog.info('multisig init stream: ', data)
    const senderAddress = new PublicKey(sender)
    const receiverAddress = new PublicKey(receiver)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const [withdrawDataAccount] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const streamDataAccount = new PublicKey(stream_data_account)
    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = getAmountInLamports(amount)

    const anchorTx = await this.transactionBuilder.execUpdateStream(
      owners,
      safeAddress,
      safeDataAccount,
      zebecTransactionAccount,
      streamDataAccount,
      withdrawDataAccount,
      senderAddress,
      receiverAddress,
      start_time,
      end_time,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream data updated!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString(),
          safe_data_account: safeDataAccount.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execUpdateStream(data: any): Promise<any> {
    
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const initTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(initTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const updateInitAccounts = AccountKeys.updateinit(
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      safeAddress,
      receiverAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(updateInitAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        initTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'update stream transaction created!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'update stream transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async pause(data: any): Promise<any> {
    const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data
    const senderAddress = new PublicKey(sender)
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execPauseStream(
      owners,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream paused!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execPause(data: any): Promise<any> {
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data

    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const pauseTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(pauseTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })
    const signcheck = obj[signer]

    const initAccounts = AccountKeys.pause(safeAddress, receiverAddress, streamDataAccountAddress)

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Pause transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        signer
      )

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Pause transaction Approved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async resume(data: any): Promise<any> {
    const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data

    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const senderAddress = new PublicKey(sender)

    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execResumeStream(
      owners,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream resumed!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execResume(data: any): Promise<any> {
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data

    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const pauseTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(pauseTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.resume(safeAddress, receiverAddress, streamDataAccountAddress)

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction
    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Resume transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Resume transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async cancel(data: any): Promise<any> {
    const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeDataAccount = new PublicKey(safe_data_account)
    const senderAddress = new PublicKey(sender)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execCancelStream(
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress,
      withdrawDataAccountAddress,
      this.feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream Cancel!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execCancel(data: any): Promise<any> {
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, signer } = data
    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const cancelTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(cancelTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.cancel(
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      this.feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        cancelTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        cancelTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Cancel transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        cancelTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Cancel transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async instantTransfer(data: any): Promise<any> {
    const { safe_address, receiver, safe_data_account, sender } = data
    const senderAddress = new PublicKey(sender)
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execInstantStream(
      owners,
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress,
      withdrawDataAccountAddress
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'Instant transfer created !',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execInstantTransfer(data: any): Promise<any> {

    const { safe_address, safe_data_account, transaction_account, receiver, signer } = data
    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const receiverAddress = new PublicKey(receiver)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const instantTransferTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findSolWithdrawEscrowAccount(safeAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(instantTransferTransactionAccountAddress)
    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })
   

    const initAccounts = AccountKeys.instanttransfer(
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      withdrawDataAccountAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        instantTransferTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        instantTransferTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Instant transfer transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        instantTransferTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Instant transfer transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async transferFromSafe(data: any): Promise<any> {
    const { sender, safe_address, receiver, safe_data_account, amount } = data
    const senderAddress = new PublicKey(sender)
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = getAmountInLamports(amount)

    const anchorTx = await this.transactionBuilder.execTransfer(
      owners,
      senderAddress,
      receiverAddress,
      zebecTransactionAccount,
      safeDataAccount,
      safeAddress,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'Funds transfered to receipient !',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execTransferFromSafe(data: any): Promise<any> {

    const { safe_address, safe_data_account, transaction_account, receiver, signer } = data
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const TransferFromSafeAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(TransferFromSafeAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.transferfromsafe(safeAddress, receiverAddress)

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        TransferFromSafeAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        TransferFromSafeAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Funds transfer to receipient executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        TransferFromSafeAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Funds transfer transaction approved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async fetchStreamData(stream_data_account: PublicKey): Promise<any> {
    const response = await this.streamProgram.account.stream.fetch(stream_data_account)
    return response
  }
}

export class ZebecTokenTreasury extends ZebecMultisig {
  constructor(anchorProvider: AnchorProvider, feeReceiver: string, logger: boolean = false) {
    super(anchorProvider, feeReceiver, logger)
    this.consolelog.info('zebec token treasury object initialized!')
  }

  async deposit(data: any): Promise<any> {

    const { safe_address, safe_data_account, sender, amount, token_mint_address } = data
    const senderAddress = new PublicKey(sender)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const pdaTokenData = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)
    const zebecVaultAssociatedTokenAddress = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)

    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = await getTokenAmountInLamports(amount,tokenMintAddress,this.multisigProgram)

    const anchorTx = await this.transactionBuilder.execDepositTokenToVault(
      owners,
      zebecVaultAddress,
      safeAddress,
      safeDataAccount,
      zebecTransactionAccount,
      senderAddress,
      tokenMintAddress,
      zebecVaultAssociatedTokenAddress,
      pdaTokenData,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'Token Deposited !',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execDespoit(data: any): Promise<any> {

    const { safe_address, safe_data_account, transaction_account, signer, token_mint_address } = data
    const safeAddress = new PublicKey(safe_address)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const depositAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const pdaTokenData = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)
    const [zebecVaultAssociatedTokenAddress] = await this._findAssociatedTokenAddress(
      zebecVaultAddress,
      tokenMintAddress
    )
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(depositAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.depositToken(
      zebecVaultAddress,
      safeAddress,
      tokenMintAddress,
      zebecVaultAssociatedTokenAddress,
      pdaTokenData
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        depositAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        depositAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Deposit transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        depositAccountAddress,
        signer
      )

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Deposit transaction Approved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async init(data: any): Promise<any> {

    const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount, token_mint_address } = data
    const senderAddress = new PublicKey(sender)
    const receiverAddress = new PublicKey(receiver)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccount = new PublicKey(safe_data_account)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const [withdrawDataAccount] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const streamDataAccount = Keypair.generate()
    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.multisigProgram)

    const anchorTx = await this.transactionBuilder.execStreamInitToken(
      owners,
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
      tokenMintAddress,
      start_time,
      end_time,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [streamDataAccount, zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream initiated!',
        data: {
          transactionHash: signature,
          stream_data_account: streamDataAccount.publicKey.toString(),
          transaction_account: zebecTransactionAccount.publicKey.toString(),
          safe_data_account: safeDataAccount.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execInit(data: any): Promise<any> {
    const {stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer} = data
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const initTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(initTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.inittoken(
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      this.feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      safeAddress,
      receiverAddress,
      tokenMintAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        initTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'stream token transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Stream transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async updateStream(data: any): Promise<any> {

    const { safe_address, safe_data_account, sender, receiver, start_time, end_time, amount, token_mint_address, stream_data_account } = data
    const senderAddress = new PublicKey(sender)
    const receiverAddress = new PublicKey(receiver)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccount = new PublicKey(safe_data_account)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const [withdrawDataAccount] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const streamDataAccount = new PublicKey(stream_data_account)
    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = await getTokenAmountInLamports(amount, tokenMintAddress, this.multisigProgram)

    const anchorTx = await this.transactionBuilder.execUpdateStreamToken(
      owners,
      safeAddress,
      safeDataAccount,
      zebecTransactionAccount,
      streamDataAccount,
      withdrawDataAccount,
      senderAddress,
      receiverAddress,
      tokenMintAddress,
      start_time,
      end_time,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream update initiated!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString(),
          safe_data_account: safeDataAccount.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execUpdateStream(data: any): Promise<any> {
    const {stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer} = data
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const initTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(initTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.updateinittoken(
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      safeAddress,
      receiverAddress,
      tokenMintAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        initTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'stream token update transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        initTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Stream transaction update Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async pause(data: any): Promise<any> {

    const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const senderAddress = new PublicKey(sender)

    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execStreamPauseToken(
      owners,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream paused!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execPause(data: any): Promise<any> {
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const pauseTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(pauseTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.pausetoken(safeAddress, receiverAddress, streamDataAccountAddress)

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Pause transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        pauseTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Pause transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async resume(data: any): Promise<any> {

    const { safe_address, receiver, stream_data_account, safe_data_account, sender } = data
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const senderAddress = new PublicKey(sender)

    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execResumeStream(
      owners,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream Resumed!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execResume(data: any): Promise<any> {
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer} = data
    const receiverAddress = new PublicKey(receiver)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeAddress = new PublicKey(safe_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const resumeTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(resumeTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.resumetoken(safeAddress, receiverAddress, streamDataAccountAddress)

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        resumeTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        resumeTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Resume transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        resumeTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Resume transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async cancel(data: any): Promise<any> {

    const { safe_address, receiver, stream_data_account, safe_data_account, sender, token_mint_address } = data
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const senderAddress = new PublicKey(sender)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const [withdrawDataAccountAddress] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const pdaTokenData = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)
    const destTokenData = await this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress)
    const feeTokenData = await this._getAccociatedTokenAddress(feeVaultAddress, tokenMintAddress)
    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execStreamCancelToken(
      owners,
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress,
      withdrawDataAccountAddress,
      this.feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      tokenMintAddress,
      pdaTokenData,
      destTokenData,
      feeTokenData
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'stream Cancel!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execCancel(data: any): Promise<any> {
    const { stream_data_account, safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer} = data

    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const receiverAddress = new PublicKey(receiver)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const streamDataAccountAddress = new PublicKey(stream_data_account)
    const [feeVaultAddress] = await this._findFeeVaultAddress(this.feeReceiverAddress)
    const [feeVaultDataAddress] = await this._findFeeVaultDataAccount(this.feeReceiverAddress)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const cancelTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(cancelTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const pdaTokenData = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)
    const destTokenData = await this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress)
    const feeTokenData = await this._getAccociatedTokenAddress(feeVaultAddress, tokenMintAddress)

    const initAccounts = AccountKeys.canceltoken(
      zebecVaultAddress,
      receiverAddress,
      safeAddress,
      this.feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      tokenMintAddress,
      pdaTokenData,
      destTokenData,
      feeTokenData
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        cancelTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        cancelTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Cancel transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        cancelTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Cancel transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async instanttransfer(data: any): Promise<any> {

    const { safe_address, receiver, safe_data_account, sender, token_mint_address } = data
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const senderAddress = new PublicKey(sender)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const [withdrawDataAccountAddress] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const pdaTokenData = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)

    const destTokenData = await this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress)

    const zebecTransactionAccount = Keypair.generate()

    const anchorTx = await this.transactionBuilder.execInstantStreamToken(
      owners,
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      zebecTransactionAccount,
      safeDataAccount,
      senderAddress,
      withdrawDataAccountAddress,
      tokenMintAddress,
      pdaTokenData,
      destTokenData
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'Instant transfer success!',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execInstanttransfer(data: any): Promise<any> {

    const { safe_address, safe_data_account, transaction_account, receiver, token_mint_address, signer } = data
    const safeAddress = new PublicKey(safe_address)
    const [zebecVaultAddress] = await this._findZebecVaultAccount(safeAddress)
    const receiverAddress = new PublicKey(receiver)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const instantTransferTransactionAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const [withdrawDataAccountAddress] = await this._findTokenWithdrawEscrowAccount(safeAddress, tokenMintAddress)
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(instantTransferTransactionAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const pdaTokenData = await this._getAccociatedTokenAddress(zebecVaultAddress, tokenMintAddress)

    const destTokenData = await this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress)

    const initAccounts = AccountKeys.instanttransfertoken(
      zebecVaultAddress,
      receiverAddress,
      safeAddress,
      withdrawDataAccountAddress,
      tokenMintAddress,
      pdaTokenData,
      destTokenData
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        instantTransferTransactionAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        instantTransferTransactionAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Instant transfer transaction executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        instantTransferTransactionAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Instant transfer transaction Aprroved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async transferTokenFromSafe(data: any): Promise<any> {

    const { sender, safe_address, receiver, safe_data_account, amount, token_mint_address } = data
    const senderAddress = new PublicKey(sender)
    const safeAddress = new PublicKey(safe_address)
    const receiverAddress = new PublicKey(receiver)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const safeDataAccount = new PublicKey(safe_data_account)
    const safe_details = await this._fetchTresholdData(safeDataAccount)
    const owners = safe_details.owners
    const destTokenAddress = await this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress)
    const sourceTokenAddress = await this._getAccociatedTokenAddress(safeAddress, tokenMintAddress)

    const zebecTransactionAccount = Keypair.generate()

    const amountInLamports = await getTokenAmountInLamports(amount,tokenMintAddress,this.multisigProgram)

    const anchorTx = await this.transactionBuilder.execTransferToken(
      owners,
      safeAddress,
      safeDataAccount,
      zebecTransactionAccount,
      senderAddress,
      receiverAddress,
      destTokenAddress,
      sourceTokenAddress,
      tokenMintAddress,
      amountInLamports
    )

    const tx = await this._makeTxn(anchorTx, [zebecTransactionAccount])
    const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
    this.consolelog.info('transaction after signing: ', signedRawTx)

    try {
      const signature = await sendTx(signedRawTx, this.anchorProvider)
      this.consolelog.info(`transaction success, TXID: ${signature}`)
      return {
        status: 'success',
        message: 'Funds transfered to receipient !',
        data: {
          transactionHash: signature,
          transaction_account: zebecTransactionAccount.publicKey.toString()
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: parseErrorMessage(err.message),
        data: null
      }
    }
  }

  async execTransferTokenFromSafe(data: any): Promise<any> {

    const { safe_address, safe_data_account, token_mint_address, transaction_account, receiver, signer } = data
    const safeAddress = new PublicKey(safe_address)
    const tokenMintAddress = new PublicKey(token_mint_address)
    const receiverAddress = new PublicKey(receiver)
    const destTokenAddress = await this._getAccociatedTokenAddress(receiverAddress, tokenMintAddress)
    const sourceTokenAddress = await this._getAccociatedTokenAddress(safeAddress, tokenMintAddress)
    const safeDataAccountAddress = new PublicKey(safe_data_account)
    const TransferFromSafeAccountAddress = new PublicKey(transaction_account)
    // how to automate this transaction, trigger this transaction
    // what happens to withdrawData (Since ownerA might start transaction) and has withdrawData accoridingly
    // what if ownerB exec this function
    const safe_details = await this._fetchTresholdData(safeDataAccountAddress)
    const transaction_details = await this.fetchMultiSigStreamData(TransferFromSafeAccountAddress)

    const ownerarray = safe_details.owners
    const signaturesarray = transaction_details.signers

    const obj = {}
    ownerarray.forEach((element, index) => {
      obj[element] = signaturesarray[index]
    })

    const initAccounts = AccountKeys.transfertokenfromsafe(
      safeAddress,
      receiverAddress,
      tokenMintAddress,
      destTokenAddress,
      sourceTokenAddress
    )

    const threshholdCount = safe_details.threshold.toString() // minimum signers required to execute transaction

    const count = signaturesarray.filter((value) => value === true).length

    if (Number(count + 1) === Number(threshholdCount)) {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        TransferFromSafeAccountAddress,
        signer
      )

      const remainingAccounts = AccountKeys.remainingAccounts(initAccounts, safeAddress)

      const anchorExecTx = await this.transactionBuilder.execTransaction(
        safeAddress,
        safeDataAccountAddress,
        TransferFromSafeAccountAddress,
        remainingAccounts
      )

      anchorTx.add(anchorExecTx)

      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Funds transfer to receipient executed!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    } else {
      const anchorTx = await this.transactionBuilder.execApproveTransaction(
        safeDataAccountAddress,
        TransferFromSafeAccountAddress,
        signer
      )
      const tx = await this._makeTxn(anchorTx)
      const signedRawTx = await this.anchorProvider.wallet.signTransaction(tx)
      this.consolelog.info('transaction after signing: ', signedRawTx)

      try {
        const signature = await sendTx(signedRawTx, this.anchorProvider)
        this.consolelog.info(`transaction success, TXID: ${signature}`)
        return {
          status: 'success',
          message: 'Funds transfer transaction approved!!',
          data: {
            transactionHash: signature
          }
        }
      } catch (err) {
        return {
          status: 'error',
          message: parseErrorMessage(err.message),
          data: null
        }
      }
    }
  }

  async fetchStreamData(stream_data_account: PublicKey): Promise<any> {
    const response = await this.streamProgram.account.stream.fetch(stream_data_account)
    return response
  }

  async withdraw(): Promise<any> {}
}

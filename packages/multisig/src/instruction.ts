import {
  BN,
  Program
} from '@project-serum/anchor'
import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@project-serum/anchor/dist/cjs/utils/token'
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction
} from '@solana/web3.js'

import {
  STREAM_SIZE,
  STREAM_TOKEN_SIZE,
  ZEBEC_STREAM
} from './config'
import {
  getAmountInBN,
  getTxSize
} from './services'
import { AccountKeys } from './services/accounts'

// Test code Mappings
// multisig: MultisigDataAccount
// multisigSigner: MultisigSafeAccount
// transaction: zebecTransactionDataAccount

export class ZebecTransactionBuilder {
  readonly _multisigProgram: Program
  readonly _streamProgram: Program

  constructor(multisigProgram: Program, streamProgram: Program) {
    this._multisigProgram = multisigProgram;
    this._streamProgram = streamProgram;
  }

  async execApproveTransaction(
    multisigSafeAddress: PublicKey,
    zebecAccountAndDataStoringTxAccount: PublicKey,
    senderAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._multisigProgram.methods
      .approve()
      .accounts({
        multisig: multisigSafeAddress,
        transaction: zebecAccountAndDataStoringTxAccount,
        owner: senderAddress
      })
      .transaction()

    return tx
  }

  async execTransaction(
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTxAccount: PublicKey,
    remainingAccounts: AccountMeta[]
  ): Promise<any> {
    const tx = await this._multisigProgram.methods
      .executeTransaction()
      .accounts({
        multisig: safeDataAccount,
        multisigSigner: safeAddress,
        transaction: zebecTxAccount
      })
      .remainingAccounts(remainingAccounts)
      .transaction()

    return tx
  }

  async execCreateSafe(
    multisigDataAccount: Keypair,
    multisigSafeNonce: number,
    owners: PublicKey[],
    threshold: number
  ): Promise<Transaction> {
    const multisigAccountSize = 200
    const thresholdBN = new BN(threshold)

    const preIx = await this._multisigProgram.account.multisig.createInstruction(
      multisigDataAccount,
      multisigAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createMultisig(owners, thresholdBN, multisigSafeNonce)
      .accounts({
        multisig: multisigDataAccount.publicKey
      })
      .preInstructions([preIx])
      .signers([multisigDataAccount])
      .transaction()

    return tx
  }

  async execFeeVault(
    feeReceiverAddress: PublicKey,
    feeVaultAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feePercentage: number
  ): Promise<Transaction> {
    const calculatedFeePercentage = new BN(feePercentage * 100)

    const tx = await this._streamProgram.methods
      .createFeeAccount(calculatedFeePercentage)
      .accounts({
        feeOwner: feeReceiverAddress,
        feeVault: feeVaultAddress,
        feeVaultData: feeVaultDataAddress,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .transaction()

    return tx
  }

  async execDepositSol(
    zebecVaultAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const amountBN = await getAmountInBN(amount);

    const tx = await this._streamProgram.methods
      .instantNativeTransfer(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        sender: senderAddress,
        receiver: receiverAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId
      })
      .transaction()

    return tx
  }

  async execDepositToken(
    zebecVaultAddress: PublicKey,
    receiverAddress: PublicKey,
    senderAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    tokenMintAddress: PublicKey,
    zebecVaultAssociatedTokenAddress: PublicKey,
    receiverAssociatedTokenAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {

    const amountBN = await getAmountInBN(amount);
    const tx = await this._streamProgram.methods
      .instantTokenTransfer(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        destAccount: receiverAddress,
        sourceAccount: senderAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
        destTokenAccount: receiverAssociatedTokenAddress
      })
      .transaction()

    return tx
  }

  async execDepositToVault(
    owners: PublicKey[],
    zebecVaultAddress: PublicKey,
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    senderAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {

    const amountBN = await getAmountInBN(amount);

    const zebecDepositAccounts = AccountKeys.deposit(zebecVaultAddress, safeAddress)

    const txAccountSize = getTxSize(zebecDepositAccounts,owners,false,8)

    const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.DEPOSIT_SOL, {
      amount: amountBN
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecDepositAccounts, pauseSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execDepositTokenToVault(
    owners: PublicKey[],
    zebecVaultAddress: PublicKey,
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    senderAddress: PublicKey,
    tokenMintAddress: PublicKey,
    zebecVaultAssociatedTokenAddress: PublicKey,
    pdaTokenData: PublicKey,
    amount: number
  ): Promise<Transaction> {

    const amountBN = await getAmountInBN(amount);


    const zebecDepositAccounts = AccountKeys.depositToken(
      zebecVaultAddress,
      safeAddress,
      tokenMintAddress,
      zebecVaultAssociatedTokenAddress,
      pdaTokenData
    )

    const txAccountSize = getTxSize(zebecDepositAccounts,owners,false,8)

    const depositSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.DEPOSIT_TOKEN, {
      amount: amountBN
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecDepositAccounts, depositSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execInitStream(
    owners: PublicKey[],
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    streamDataAccountAddress: Keypair,
    withdrawDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount);

    const streamEscrowAccountDataSize = STREAM_SIZE

    const zebecInitStreamAccounts = AccountKeys.init(
      streamDataAccountAddress.publicKey,
      withdrawDataAccountAddress,
      feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      safeAddress,
      receiverAddress
    )

    const txAccountSize = getTxSize(zebecInitStreamAccounts,owners,false,8 * 3 + 1 * 2)


    const streamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.INIT_STREAM_SOL, {
      startTime: startTimeBN,
      endTime: endTimeBN,
      amount: amountBN,
      canUpdate:true,
      canCancel:true
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const createStreamEscrowAccountIx = await this._streamProgram.account.stream.createInstruction(
      streamDataAccountAddress,
      streamEscrowAccountDataSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createStreamEscrowAccountIx, createTxDataStoringAccountIx])
      .signers([streamDataAccountAddress, zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execUpdateStream(
    owners: PublicKey[],
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    streamDataAccountAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount);

    const zebecInitStreamAccounts = AccountKeys.updateinit(
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      safeAddress,
      receiverAddress
    )

    const txAccountSize = getTxSize(zebecInitStreamAccounts, owners, false, 8 * 3)


    const streamSolIxUpdateDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.UPDATE_STREAM_SOL, {
      startTime: startTimeBN,
      endTime: endTimeBN,
      amount: amountBN,
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamSolIxUpdateDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execPauseStream(
    owners : PublicKey[],
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    streamDataAccountAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
  ): Promise<Transaction> {

    const zebecPauseStreamAccounts = AccountKeys.pause(safeAddress, receiverAddress, streamDataAccountAddress, withdrawDataAccountAddress)

    const txAccountSize = getTxSize(zebecPauseStreamAccounts,owners,false,0)

    const pauseSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.PAUSE_STREAM_SOL, {})

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, pauseSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execResumeStream(
    owners : PublicKey[],
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    streamDataAccountAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
  ): Promise<Transaction> {
    
    const zebecResumeStreamAccounts = AccountKeys.resume(safeAddress, receiverAddress, streamDataAccountAddress, withdrawDataAccountAddress)

    const txAccountSize = getTxSize(zebecResumeStreamAccounts,owners,false,0)

    const resumeSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.RESUME_STREAM_SOL, {})

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecResumeStreamAccounts, resumeSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execCancelStream(
    zebecVaultAddress: PublicKey,
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    streamDataAccountAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey
  ): Promise<Transaction> {
    const txAccountSize = 1000
    const zebecCancelStreamAccounts = AccountKeys.cancel(
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress
    )

    const cancelSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.CANCEL_STREAM_SOL, {})

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execStreamWithdrawSol(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    zebecVaultAddress: PublicKey,
    escrowAccountAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultAddress: PublicKey,
    feeVaultDataAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._streamProgram.methods
      .withdrawStream()
      .accounts({
        zebecVault: zebecVaultAddress,
        sender: senderAddress,
        receiver: receiverAddress,
        dataAccount: escrowAccountAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        systemProgram: SystemProgram.programId
      })
      .transaction()

    return tx
  }

  async execInstantStream(
    owners : PublicKey[],
    zebecVaultAddress: PublicKey,
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
    amountInLamports: number,
  ): Promise<Transaction> {
    
    const zebecCancelStreamAccounts = AccountKeys.instanttransfer(
      zebecVaultAddress,
      safeAddress,
      receiverAddress,
      withdrawDataAccountAddress
    )

    const amountBN = new BN(amountInLamports)

    const txAccountSize = getTxSize(zebecCancelStreamAccounts,owners,false,8)

    const instantStreamSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.INSTANT_TRANSFER_SOL, {
      amount: amountBN
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, instantStreamSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execTransfer(
    owners : PublicKey[],
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    safeAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {

    const zebecInstantTransferAccounts = AccountKeys.transferfromsafe(safeAddress, receiverAddress)

    const txAccountSize = getTxSize(zebecInstantTransferAccounts,owners,false,8)

    const amountBN = await getAmountInBN(amount);

    const transferSolIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.DIRECT_TRANSFER_SOL, {
      amount: amountBN
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecInstantTransferAccounts, transferSolIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execTransferToken(
    owners : PublicKey[],
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    destTokenAddress: PublicKey,
    sourceTokenAddress: PublicKey,
    tokenMintAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {

    const zebecInstantTransferAccounts = AccountKeys.transfertokenfromsafe(
      safeAddress,
      receiverAddress,
      tokenMintAddress,
      destTokenAddress,
      sourceTokenAddress
    )

    const txAccountSize = getTxSize(zebecInstantTransferAccounts,owners,false,8)
    const amountBN = await getAmountInBN(amount);

    const transferTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.DIRECT_TRANSFER_TOKEN, {
      amount: amountBN
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecInstantTransferAccounts, transferTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execUpdateStreamToken(
    owners: PublicKey[],
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    streamDataAccountAddress: PublicKey,
    withdrawDataAccount: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    tokenMintAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount);

    const zebecUpdateInitStreamAccounts = AccountKeys.updateinittoken(
      streamDataAccountAddress,
      withdrawDataAccount,
      safeAddress,
      receiverAddress,
      tokenMintAddress
    )

    const txAccountSize = getTxSize(zebecUpdateInitStreamAccounts, owners, true, 8 * 3)

    const updateStreamTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.UPDATE_STREAM_TOKEN, {
      startTime: startTimeBN,
      endTime: endTimeBN,
      amount: amountBN,
    })

    const createUpdateTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecUpdateInitStreamAccounts, updateStreamTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createUpdateTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execStreamInitToken(
    owners: PublicKey[],
    safeAddress: PublicKey,
    safeDataAccount: PublicKey,
    zebecTransactionAccount: Keypair,
    streamDataAccountAddress: Keypair,
    withdrawDataAccount: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    tokenMintAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount);

    const zebecInitStreamAccounts = AccountKeys.inittoken(
      streamDataAccountAddress.publicKey,
      withdrawDataAccount,
      feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      safeAddress,
      receiverAddress,
      tokenMintAddress
    )

    const streamEscrowAccountDataSize = STREAM_TOKEN_SIZE

    const txAccountSize = getTxSize(zebecInitStreamAccounts, owners, true, 8 * 3 + 1 * 2)

    const streamTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.INIT_STREAM_TOKEN, {
      startTime: startTimeBN,
      endTime: endTimeBN,
      amount: amountBN,
      canUpdate: true,
      canCancel:true
    })

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const createStreamEscrowAccountIx = await this._streamProgram.account.streamToken.createInstruction(
      streamDataAccountAddress,
      streamEscrowAccountDataSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecInitStreamAccounts, streamTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createStreamEscrowAccountIx, createTxDataStoringAccountIx])
      .signers([streamDataAccountAddress, zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execStreamPauseToken(
    owners: PublicKey[],
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    streamDataAccountAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    tokenMintAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey
  ): Promise<Transaction> {

    const zebecPauseStreamAccounts = AccountKeys.pausetoken(safeAddress, receiverAddress, streamDataAccountAddress, tokenMintAddress, withdrawDataAccountAddress)

    const txAccountSize = getTxSize(zebecPauseStreamAccounts, owners, false, 0)

    const pauseTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
      ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN,
      {}
    )

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecPauseStreamAccounts, pauseTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execStreamResumeToken(
    owners: PublicKey[],
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    streamDataAccountAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    tokenMintAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey
  ): Promise<Transaction> {

    const zebecResumeStreamAccounts = AccountKeys.resumetoken(safeAddress, receiverAddress, streamDataAccountAddress, tokenMintAddress, withdrawDataAccountAddress)


    const txAccountSize = getTxSize(zebecResumeStreamAccounts, owners, false, 0)

    const resumeTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
      ZEBEC_STREAM.PAUSE_RESUME_STREAM_TOKEN,
      {}
    )

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecResumeStreamAccounts, resumeTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execStreamCancelToken(
    owners: PublicKey[],
    zebecVaultAddress: PublicKey,
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    streamDataAccountAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey,
    tokenMintAddress: PublicKey,
    pdaTokenData: PublicKey,
    destTokenData: PublicKey,
    feeTokenData: PublicKey
  ): Promise<Transaction> {
    const zebecCancelStreamAccounts = AccountKeys.canceltoken(
      zebecVaultAddress,
      receiverAddress,
      safeAddress,
      feeReceiverAddress,
      feeVaultDataAddress,
      feeVaultAddress,
      streamDataAccountAddress,
      withdrawDataAccountAddress,
      tokenMintAddress,
      pdaTokenData,
      destTokenData,
      feeTokenData
    )


    const txAccountSize = getTxSize(zebecCancelStreamAccounts, owners, false, 0)

    const cancelTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(ZEBEC_STREAM.CANCEL_STREAM_TOKEN, {})

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecCancelStreamAccounts, cancelTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }

  async execStreamWithdrawToken(
    receiverAddress: PublicKey,
    senderAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feevaultAddress: PublicKey,
    zebecVaultAddress: PublicKey,
    escrowAccountAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    tokenMintAddress: PublicKey,
    zebecVaultAssociatedAccountAddress: PublicKey,
    receiverAssociatedTokenAddress: PublicKey,
    feeVaultAssociatedTokenAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._streamProgram.methods
      .withdrawTokenStream()
      .accounts({
        zebecVault: zebecVaultAddress,
        destAccount: receiverAddress,
        sourceAccount: senderAddress,
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feevaultAddress,
        dataAccount: escrowAccountAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress,
        destTokenAccount: receiverAssociatedTokenAddress,
        feeReceiverTokenAccount: feeVaultAssociatedTokenAddress
      })
      .transaction()

    return tx
  }

  async execInstantStreamToken(
    owners: PublicKey[],
    zebecVaultAddress: PublicKey,
    safeAddress: PublicKey,
    receiverAddress: PublicKey,
    zebecTransactionAccount: Keypair,
    safeDataAccount: PublicKey,
    senderAddress: PublicKey,
    withdrawDataAccountAddress: PublicKey,
    tokenMintAddress: PublicKey,
    pdaTokenData: PublicKey,
    destTokenData: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const zebecInstantStreamAccounts = AccountKeys.instanttransfertoken(
      zebecVaultAddress,
      receiverAddress,
      safeAddress,
      withdrawDataAccountAddress,
      tokenMintAddress,
      pdaTokenData,
      destTokenData
    )

    const txAccountSize = getTxSize(zebecInstantStreamAccounts, owners, false, 8)

    const amountBN = await getAmountInBN(amount);

    const instantTransferTokenIxDataBuffer = this._streamProgram.coder.instruction.encode(
      ZEBEC_STREAM.INSTANT_TRANSFER_TOKEN,
      {
        amount: amountBN
      }
    )

    const createTxDataStoringAccountIx = await this._multisigProgram.account.transaction.createInstruction(
      zebecTransactionAccount,
      txAccountSize
    )

    const tx = await this._multisigProgram.methods
      .createTransaction(this._streamProgram.programId, zebecInstantStreamAccounts, instantTransferTokenIxDataBuffer)
      .accounts({
        multisig: safeDataAccount,
        transaction: zebecTransactionAccount.publicKey,
        proposer: senderAddress
      })
      .preInstructions([createTxDataStoringAccountIx])
      .signers([zebecTransactionAccount])
      .transaction()

    return tx
  }
}

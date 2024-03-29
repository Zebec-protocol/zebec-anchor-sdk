import { BN, Program } from '@project-serum/anchor'
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token'
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
import { SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, STREAM_SIZE, STREAM_TOKEN_SIZE } from './config'
import { getAmountInBN } from './services'

/**
 * ## Zebec Transaction Builder
 *
 * Zebec Transaction Builder object provides a set of
 * dynamically generated transaction that is mapped one-to-one to
 * program methods.
 * This can be used as follows:
 *
 * ## Usage
 *
 * ```javascript
 * const txBuilder = new ZebecTransactionBuilder(program)
 * txBuilder.<method>
 * ```
 *
 * [here](https://github.com/Zebec-protocol/zebec-anchor-sdk/blob/master/packages/stream/src/instruction.ts).
 */
export class ZebecTransactionBuilder {
  readonly _program: Program

  public constructor(program: Program) {
    this._program = program
  }

  async execFeeVault(
    feeReceiverAddress: PublicKey,
    feeVaultAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feePercentage: number
  ): Promise<Transaction> {
    // calculate Fee percentage here.
    // Fee Percentage must have atmost 2 digits after decimal.
    // Eg. 0.25% is acceptable but 0.255% is not ?????? DISCUSS IT WITH THE TEAM, TODO
    const calculatedFeePercentage = new BN(feePercentage * 100)

    const tx = await this._program.methods
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

  async execUpdteFeeVault(
    feeReceiverAddress: PublicKey,
    feeVaultAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feePercentage: number
  ): Promise<Transaction> {
    // calculate Fee percentage here.
    // Fee Percentage must have atmost 2 digits after decimal.
    // Eg. 0.25% is acceptable but 0.255% is not ?????? DISCUSS IT WITH THE TEAM, TODO
    const calculatedFeePercentage = new BN(feePercentage * 100)

    const tx = await this._program.methods
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

  async execRetrieveSolFees(
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .withdrawFeesSol()
      .accounts({
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .transaction()

    return tx
  }

  async execRetrieveTokenFees(
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey,
    tokenMintAddress: PublicKey,
    feeVaultTokenAccount: PublicKey,
    feeOwnerTokenAccount: PublicKey
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .withdrawFeesToken()
      .accounts({
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        feeReceiverVaultTokenAccount: feeVaultTokenAccount,
        feeOwnerTokenAccount: feeOwnerTokenAccount
      })
      .transaction()

    return tx
  }

  async execDepositSolToZebecWallet(
    senderAddress: PublicKey,
    zebecVaultAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const amountBN = await getAmountInBN(amount);
    const tx = await this._program.methods
      .depositSol(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        sender: senderAddress,
        systemProgram: SystemProgram.programId
      })
      .transaction()

    return tx
  }

  async execDepositTokenToZebecWallet(
    zebecVaultAddress: PublicKey,
    senderAddress: PublicKey,
    tokenMintAddress: PublicKey,
    senderAssociatedTokenAddress: PublicKey,
    zebecVaultAssociatedAccountAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {

    const amountBN = await getAmountInBN(amount);

    const tx = await this._program.methods
      .depositToken(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        sourceAccount: senderAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        sourceAccountTokenAccount: senderAssociatedTokenAddress,
        pdaAccountTokenAccount: zebecVaultAssociatedAccountAddress
      })
      .transaction()

    return tx
  }

  async execWithdrawSolFromZebecVault(
    senderAddress: PublicKey,
    zebecVaultAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const amountBN = await getAmountInBN(amount);

    const tx = await this._program.methods
      .nativeWithdrawal(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        sender: senderAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId
      })
      .transaction()

    return tx
  }

  async execWithdrawTokenFromZebecVault(
    senderAddress: PublicKey,
    zebecVaultAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    tokenMintAddress: PublicKey,
    senderAssociatedTokenAddress: PublicKey,
    escrowAssociatedTokenAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const amountBN = await getAmountInBN(amount);

    const tx = await this._program.methods
      .tokenWithdrawal(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        sourceAccount: senderAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        sourceAccountTokenAccount: senderAssociatedTokenAddress,
        pdaAccountTokenAccount: escrowAssociatedTokenAddress
      })
      .transaction()

    return tx
  }

  async execStreamInitSol(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    escrowAccountKeypair: Keypair,
    withdrawEscrowDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    const dataSize = STREAM_SIZE

    const createAccountIx = await this._program.account.stream.createInstruction(escrowAccountKeypair, dataSize)

    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount)
    const canCancel = true
    const canUpdate = true

    const tx = this._program.methods
      .nativeStream(startTimeBN, endTimeBN, amountBN, canCancel, canUpdate)
      .accounts({
        dataAccount: escrowAccountKeypair.publicKey,
        withdrawData: withdrawEscrowDataAccountAddress,
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        sender: senderAddress,
        receiver: receiverAddress,
        systemProgram: SystemProgram.programId
      })
      .preInstructions([createAccountIx])
      .signers([escrowAccountKeypair])
      .transaction()

    return tx
  }

  async execStreamUpdateSol(
    escrowAccountPublicKey: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    
    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount);

    const tx = this._program.methods
      .nativeStream(startTimeBN, endTimeBN, amountBN)
      .accounts({
        dataAccount: escrowAccountPublicKey,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId,
        sender: senderAddress,
        receiver: receiverAddress,
      }).transaction()
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
    const tx = await this._program.methods
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

  async execStreamCancelSol(
    zebecVaultAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    escrowDataAccountAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .cancelStream()
      .accounts({
        zebecVault: zebecVaultAddress,
        sender: senderAddress,
        receiver: receiverAddress,
        dataAccount: escrowDataAccountAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        systemProgram: SystemProgram.programId
      })
      .transaction()

    return tx
  }

  async execStreamPauseSol(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    escrowAccountAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .pauseStream()
      .accounts({
        sender: senderAddress,
        receiver: receiverAddress,
        dataAccount: escrowAccountAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
      })
      .transaction()

    return tx
  }

  async execStreamResumeSol(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    escrowAccountAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .pauseStream()
      .accounts({
        sender: senderAddress,
        receiver: receiverAddress,
        dataAccount: escrowAccountAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
      })
      .transaction()

    return tx
  }

  async execStreamInitToken(
    escrowAccountKeypair: Keypair,
    withdrawEscrowDataAccountAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    tokenMintAddress: PublicKey,
    startTime: number,
    endTime: number,
    amount: number
  ): Promise<Transaction> {
    
    const dataSize = STREAM_TOKEN_SIZE

    const createAccountIx = await this._program.account.stream.createInstruction(escrowAccountKeypair, dataSize)

    const startTimeBN = new BN(startTime)
    const endTimeBN = new BN(endTime)
    const amountBN = await getAmountInBN(amount);
    const canUpdate = true;
    const canCancel = true;

    const tx = await this._program.methods
      .tokenStream(startTimeBN, endTimeBN, amountBN, canCancel, canUpdate)
      .accounts({
        dataAccount: escrowAccountKeypair.publicKey,
        withdrawData: withdrawEscrowDataAccountAddress,
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        sourceAccount: senderAddress,
        destAccount: receiverAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint: tokenMintAddress,
        rent: SYSVAR_RENT_PUBKEY
      })
      .preInstructions([createAccountIx])
      .signers([escrowAccountKeypair])
      .transaction()

    return tx
  }

  async execUpdateStreamInitToken(
    escrowAccountPublicKey: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
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

    const tx = await this._program.methods
      .tokenStreamUpdate(startTimeBN, endTimeBN, amountBN)
      .accounts({
        dataAccount: escrowAccountPublicKey,
        withdrawData: withdrawEscrowDataAccountAddress,
        sourceAccount: senderAddress,
        destAccount: receiverAddress,
        mint: tokenMintAddress,
      })
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
    const tx = await this._program.methods
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

  async execStreamCancelToken(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    feeReceiverAddress: PublicKey,
    feeVaultDataAddress: PublicKey,
    feeVaultAddress: PublicKey,
    zebecVaultAddress: PublicKey,
    escrowAccountAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    tokenMintAddress: PublicKey,
    zebecVaultAssociatedTokenAddress: PublicKey,
    receiverAssociatedTokenAddress: PublicKey,
    feeVaultAssociatedTokenAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .cancelTokenStream()
      .accounts({
        destAccount: receiverAddress,
        sourceAccount: senderAddress,
        feeOwner: feeReceiverAddress,
        feeVaultData: feeVaultDataAddress,
        feeVault: feeVaultAddress,
        zebecVault: zebecVaultAddress,
        dataAccount: escrowAccountAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
        destTokenAccount: receiverAssociatedTokenAddress,
        feeReceiverTokenAccount: feeVaultAssociatedTokenAddress
      })
      .transaction()

    return tx
  }

  async execStreamPauseToken(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    escrowAccountAddress: PublicKey,
    tokenMintAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey
  ): Promise<Transaction> {
    const tx = await this._program.methods
      .pauseResumeTokenStream()
      .accounts({
        sender: senderAddress,
        receiver: receiverAddress,
        dataAccount: escrowAccountAddress,
        mint: tokenMintAddress,
        withdrawData: withdrawEscrowDataAccountAddress
      })
      .transaction()

    return tx
  }

  async execInstantSolTransfer(
    zebecVaultAddress: PublicKey,
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    withdrawEscrowDataAccountAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const amountBN = await getAmountInBN(amount);

    const tx = await this._program.methods
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

  async execInstantTokenTransfer(
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

    const tx = await this._program.methods
      .instantTokenTransfer(amountBN)
      .accounts({
        zebecVault: zebecVaultAddress,
        destAccount: receiverAddress,
        sourceAccount: senderAddress,
        withdrawData: withdrawEscrowDataAccountAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        pdaAccountTokenAccount: zebecVaultAssociatedTokenAddress,
        destTokenAccount: receiverAssociatedTokenAddress
      })
      .transaction()

    return tx
  }

  async execDirectTokenTransfer(
    receiverAddress: PublicKey,
    senderAddress: PublicKey,
    tokenMintAddress: PublicKey,
    senderAssociatedTokenAddress: PublicKey,
    receiverAssociatedTokenAddress: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const amountBN = await getAmountInBN(amount);

    const tx = await this._program.methods
      .sendTokenDirectly(amountBN)
      .accounts({
        sourceAccount: senderAddress,
        destAccount: receiverAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        mint: tokenMintAddress,
        sourceAccountTokenAccount: senderAssociatedTokenAddress,
        destTokenAccount: receiverAssociatedTokenAddress
      })
      .transaction()

    return tx
  }
}

import { AnchorProvider, BN, Program, translateError, utils, Wallet } from '@project-serum/anchor'
import {
  ConfirmOptions,
  Connection,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  TransactionError,
  TransactionSignature
} from '@solana/web3.js'

import { ZEBEC_PROGRAM_IDL } from '../idl'

export const parseErrorMessage = (message: string): string => {
  const regex = /error: 0x(.*)/gm
  const errors = ZEBEC_PROGRAM_IDL.errors

  let m: any, errcode: number

  while ((m = regex.exec(message)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    if (m.length > 1) {
      errcode = parseInt(m[1], 16)
    }
  }

  const errObj = errors.find((e) => e.code === errcode)
  if (errcode && errObj) {
    return errObj.msg.toLowerCase()
  }

  return message
}

const getErrorForTransaction = async (connection: Connection, txid: TransactionSignature) => {
  // wait for all confirmation before geting transaction
  const commitment = 'finalized'
  const latestBlockhash = await connection.getLatestBlockhash(commitment)
  await connection.confirmTransaction({ signature: txid, ...latestBlockhash }, commitment)

  const tx = await connection.getParsedTransaction(txid, commitment)
  const errors: string[] = []

  if (tx?.meta && tx.meta.logMessages) {
    tx.meta.logMessages.forEach((log: any) => {
      const regex = /Error: (.*)/gm
      let m: any
      while ((m = regex.exec(log)) !== null) {
        // this is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++
        }
        if (m.length > 1) {
          errors.push(m[1])
        }
      }
    })
  }
  return errors
}

export const sendTx = async (tx: Transaction, provider: AnchorProvider): Promise<TransactionSignature> => {
  // tx.instructions.map(i => i.keys.map(k => console.log(k.pubkey.toBase58(), k.isSigner, k.isWritable)))
  const connection = provider.connection
  const options = provider.opts

  const rawTxn = tx.serialize()

  let txid = utils.bytes.bs58.encode(tx.signatures[0].signature)

  try {
    // const blockhash = tx.recentBlockhash
    // const lastValidBlockHeight = tx.lastValidBlockHeight
    const { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash(options)

    const startTime = now()
    let confirmed = false
    let abort = false

    const sendTxMultiple = async () => {
      let blockheight = await connection.getBlockHeight(options)
      while (!confirmed && !abort && blockheight < lastValidBlockHeight) {
        try {
          if (confirmed) return
          await connection.sendRawTransaction(rawTxn, options)
          console.debug('Signature', txid)
          await new Promise((r) => setTimeout(r, 1000))
          blockheight = await connection.getBlockHeight(options)
        } catch (err: any) {
          if (err.message) {
            if (err.message.includes('This transaction has already been processed')) {
              return
            } else if (err.message.includes('Blockhash not found')) {
              console.debug('Expected error: ', err.message)
              await sleep(1000)
              blockheight = await connection.getBlockHeight(options)
              continue
            } else {
              throw err
            }
          }
          throw err
        }
      }

      if (!confirmed && blockheight >= lastValidBlockHeight) {
        throw new Error('Blockheght exceeded.')
      }
    }

    const confirmTransaction = async () => {
      let err: TransactionError | null = null
      let retry = 0
      const maxRetry = 5
      let blockheight = await connection.getBlockHeight(options)
      while (blockheight < lastValidBlockHeight && retry < maxRetry) {
        console.debug('Try:', retry + 1)
        try {
          const response = await connection.confirmTransaction(
            {
              signature: txid,
              blockhash: blockhash,
              lastValidBlockHeight: lastValidBlockHeight
            },
            options?.commitment
          )

          err = response.value.err

          if (!err) {
            const endTime = Date.now()
            console.debug('Confirmed at: %d', endTime)
            console.debug('Time elapsed: %d', endTime - startTime)
            confirmed = true

            return
          }

          if (err) {
            if (typeof err === 'string') {
              console.debug('confirm transaction err: ' + err)
              throw new Error('Failed to confirm transaction: ' + err)
            } else {
              console.debug('confirm transaction err: ' + JSON.stringify(err))
              throw new Error('Failed to confirm transaction')
            }
          }
        } catch (err: any) {
          if (err.message && err.message.includes('block height exceeded')) {
            abort = true
            throw err
          }
          retry += 1
          blockheight = await connection.getBlockHeight(options)
          continue
        }
      }

      if (err) {
        if (typeof err === 'string') {
          console.debug('confirm transaction err: ' + err)
          throw new Error('Failed to confirm transaction: ' + err)
        } else {
          console.debug('confirm transaction err: ' + JSON.stringify(err))
          throw new Error('Failed to confirm transaction')
        }
      }
    }

    await Promise.all([sendTxMultiple(), confirmTransaction()])
    return txid
  } catch (err: any) {
    console.debug('error:', err)
    const errorMap: Map<number, string> = new Map()
    ZEBEC_PROGRAM_IDL.errors.forEach((error) => errorMap.set(error.code, error.msg))
    const translatedError = translateError(err, errorMap)
    console.debug('translated error:', translateError)
    throw translatedError
  }

  // (async () => {
  //     while(!done && now() - startTime < retryTimeout) {
  //         connection.sendRawTransaction(rawTxn, options);
  //         await sleep(2000);
  //     }
  // })();

  // let status: any;

  // try {
  //     const signatureResult = await connection.confirmTransaction(
  //         {
  //             signature: txid,
  //             blockhash: tx.recentBlockhash,
  //             lastValidBlockHeight: tx.lastValidBlockHeight
  //         } as any,
  //         provider.connection.commitment
  //     );
  //     status = signatureResult.value;
  // } catch (error) {
  //     status = {
  //         err: error
  //     };
  // } finally {
  //     done = true;
  // }

  // if (status?.err) {
  //     let errors: string[] = [];
  //     if (
  //         (status.err as Error).message &&
  //         ((status.err as Error).message.includes("block height exceeded") ||
  //         (status.err as Error).message.includes("timeout exceeded"))
  //     ) {
  //         errors = [(status.err as Error).message];
  //     } else {
  //         errors = await getErrorForTransaction(connection, txid);
  //     }

  //     // throw new Error(
  //     //     `Raw transaction ${txid} faied (${JSON.stringify(status)})`
  //     // );
  // }
  // return txid;
}

export const getAmountInLamports = (amount: number): number => {
  return amount * LAMPORTS_PER_SOL
}

export const getTokenAmountInLamports = async (
  amount: number,
  tokenMintAddress: PublicKey,
  program: Program
): Promise<number> => {
  // get Amount Decimal Digit number
  const connection = program.provider.connection
  const tokenMetaData = await connection.getTokenSupply(tokenMintAddress)
  const decimals = tokenMetaData.value?.decimals
  return amount * Math.pow(10, decimals)
}

export const getAmountInBN = async (amount: number): Promise<BN> => {
  const tokenBalanceResponse = amount.toLocaleString('fullwide', { useGrouping: false })
  const amountBN = await new BN(tokenBalanceResponse)
  return amountBN
}

export const getClusterTime = async (provider: AnchorProvider) => {
  const parsedClock = await provider.connection.getParsedAccountInfo(SYSVAR_CLOCK_PUBKEY)
  const parsedClockAccount = (parsedClock.value!.data as ParsedAccountData).parsed
  const clusterTimestamp = parsedClockAccount.info.unixTimestamp
  return clusterTimestamp
}

export const now = () => {
  return new Date().getTime()
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const initAnchorProvider = (wallet: Wallet, rpcUrl: string, opts?: ConfirmOptions) => {
  opts = opts ?? AnchorProvider.defaultOptions()
  const connection = new Connection(rpcUrl ?? 'http://localhost:8899', opts.commitment)
  const provider = new AnchorProvider(connection, wallet, opts)
  return provider
}

export class ConsoleLog {
  readonly logger: boolean

  constructor(logger: boolean) {
    this.logger = logger
  }

  info(message: string, value: any = null) {
    if (this.logger && value) {
      console.log(message, value)
    }
  }
}

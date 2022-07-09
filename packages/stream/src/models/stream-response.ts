import { PublicKey, Signer, TransactionInstruction, TransactionSignature } from "@solana/web3.js";

export type ZebecResponse = {
    status: string,
    message: string | Error,
    data: StreamResponse | null
}

export type StreamResponse = {
    transactionHash: TransactionSignature,
    pda?: PublicKey
}

export type InstructionsAndSigners = {
    instructions: TransactionInstruction[];
    signers?: Signer[];
  };
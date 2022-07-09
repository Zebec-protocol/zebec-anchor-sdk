import { AnchorProvider } from "@project-serum/anchor";
import { Transaction, TransactionSignature } from "@solana/web3.js";
import { InstructionsAndSigners } from "../models";

export class TransactionSender {
    provider: AnchorProvider;

    constructor(provider: AnchorProvider) {
        this.provider = provider;
    }

    async sendWithWallet(
        instructionsAndSigners: InstructionsAndSigners
    ): Promise<TransactionSignature> {
        const tx = new Transaction();
        tx.add(
            ...instructionsAndSigners.instructions
        );

        return await this.provider.sendAndConfirm(
            tx,
            instructionsAndSigners.signers
        )
    }
}
import * as anchor from "@project-serum/anchor";
import { AnchorProvider } from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

import { IBatchTransferInstruction } from "./instructions";
import { parseToLamports, parseToUnits } from "./utils/parseUnits";

export type BatchSolTransferData = { account: anchor.web3.PublicKey; amount: number | string };
export type BatchTokenTransferData = { account: anchor.web3.PublicKey; amount: number | string; decimals: number };
export type TranactionExecuter = () => Promise<anchor.web3.TransactionSignature[]>;
export type TransactionPayload = {
	transactions: (anchor.web3.Transaction | anchor.web3.VersionedTransaction)[];
	blockhash: string;
	lastValidBlockHeight: number;
	execute: TranactionExecuter;
};

export class BatchTransferService<T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction> {
	constructor(
		private readonly provider: AnchorProvider,
		private readonly batchTransferIxns: IBatchTransferInstruction,
		private readonly signTransaction: (transaction: T) => Promise<T>,
	) {}

	private createTransactionExecuter(
		transactions: T[],
		blockhash: string,
		lastValidBlockHeight: number,
	): TranactionExecuter {
		const execute = async () => {
			let signatures: string[] = [];
			for (let i = 0; i < transactions.length; i++) {
				const signed = await this.signTransaction(transactions[i]);
				const signature = await this.provider.connection.sendRawTransaction(signed.serialize());
				await this.provider.connection.confirmTransaction({
					blockhash,
					lastValidBlockHeight,
					signature,
				});
				signatures.push(signature);
			}
			return signatures;
		};
		return execute;
	}

	async depositSol(authority: anchor.web3.PublicKey, amount: number | string): Promise<TransactionPayload> {
		const parsedAmount = parseToLamports(amount);
		const ix = await this.batchTransferIxns.getDepositSolInstruction(authority, parsedAmount);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		const execute = this.createTransactionExecuter([transaction as T], blockhash, lastValidBlockHeight);

		return {
			blockhash,
			lastValidBlockHeight,
			transactions: [transaction],
			execute,
		};
	}

	async depositToken(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amount: number | string,
		decimals: number,
	): Promise<TransactionPayload> {
		const parsedAmount = parseToUnits(amount, decimals);
		const ix = await this.batchTransferIxns.getDepositTokenInstruciton(authority, mint, parsedAmount);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		const execute = this.createTransactionExecuter([transaction as T], blockhash, lastValidBlockHeight);

		return {
			blockhash,
			lastValidBlockHeight,
			transactions: [transaction],
			execute,
		};
	}

	async transferSolInBatch(
		authority: anchor.web3.PublicKey,
		batchData: BatchSolTransferData[],
	): Promise<TransactionPayload> {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount }) => parseToLamports(amount));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => account);
		const ix = await this.batchTransferIxns.getSolBatchTransfer(authority, parsedAmounts, accounts);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		const execute = this.createTransactionExecuter([transaction as T], blockhash, lastValidBlockHeight);

		return {
			blockhash,
			lastValidBlockHeight,
			transactions: [transaction],
			execute,
		};
	}

	async transferTokenInBatch(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		batchData: BatchTokenTransferData[],
	): Promise<TransactionPayload> {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount, decimals }) => parseToUnits(amount, decimals));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => account);
		const ix = await this.batchTransferIxns.getTokenBatchTransfer(authority, mint, parsedAmounts, accounts);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		const execute = this.createTransactionExecuter([transaction as T], blockhash, lastValidBlockHeight);

		return {
			blockhash,
			lastValidBlockHeight,
			transactions: [transaction],
			execute,
		};
	}

	async createTokenAccounts(
		feepayer: anchor.web3.PublicKey,
		users: anchor.web3.PublicKey[],
		mint: anchor.web3.PublicKey,
	): Promise<TransactionPayload> {
		let createIxns: anchor.web3.TransactionInstruction[] = [];

		if (users.length > 13) {
			throw new Error("Accounts more than 13 will exceed max transaction size limit!");
		}

		for (let i = 0; i < users.length; i++) {
			const tokenAccount = getAssociatedTokenAddressSync(mint, users[i], true);
			createIxns.push(
				createAssociatedTokenAccountInstruction(this.provider.wallet.publicKey, tokenAccount, users[i], mint),
			);
		}

		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(...createIxns);
		transaction.feePayer = feepayer;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		const execute = this.createTransactionExecuter([transaction as T], blockhash, lastValidBlockHeight);

		return {
			blockhash,
			lastValidBlockHeight,
			transactions: [transaction],
			execute,
		};
	}
}

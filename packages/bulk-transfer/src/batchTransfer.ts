import * as anchor from "@project-serum/anchor";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { IBatchTransferInstruction } from "./instructions";
import {
	parseToLamports,
	parseToUnits,
} from "./utils/parseUnits";

export interface ITransactionPayload {
	readonly transactions: anchor.web3.Transaction[];
	readonly blockhash: string;
	readonly lastValidBlockHeight: number;
	execute(): Promise<anchor.web3.TransactionSignature[]>;
}

export class TransactionPayload implements ITransactionPayload {
	constructor(
		private provider: anchor.AnchorProvider,
		public readonly transactions: anchor.web3.Transaction[],
		public readonly blockhash: string,
		public readonly lastValidBlockHeight: number,
	) {}

	async execute(): Promise<anchor.web3.TransactionSignature[]> {
		let signatures: string[] = [];
		const signedTxs = await this.provider.wallet.signAllTransactions(this.transactions);

		for (let i = 0; i < signedTxs.length; i++) {
			const signed = signedTxs[i];
			const signature = await this.provider.connection.sendRawTransaction(signed.serialize());
			await this.provider.connection.confirmTransaction({
				blockhash: this.blockhash,
				lastValidBlockHeight: this.lastValidBlockHeight,
				signature,
			});
			signatures.push(signature);
		}
		return signatures;
	}
}

export type BatchSolTransferData = { account: anchor.web3.PublicKey; amount: number | string };
export type BatchTokenTransferData = { account: anchor.web3.PublicKey; amount: number | string; decimals: number };

export class BatchTransferService {
	constructor(
		private readonly provider: anchor.AnchorProvider,
		private readonly batchTransferIxns: IBatchTransferInstruction,
	) {}

	async checkTokenAccount({
		accounts,
		mint,
		allowOwnerOffCurve,
	}: {
		accounts: anchor.web3.PublicKey[];
		mint: anchor.web3.PublicKey;
		allowOwnerOffCurve?: boolean;
	}): Promise<anchor.web3.PublicKey[]> {
		const arr: anchor.web3.PublicKey[] = [];

		for (let i = 0; i < accounts.length; i++) {
			const account = accounts[i];
			const tokenAccount = getAssociatedTokenAddressSync(mint, account, allowOwnerOffCurve);
			const accountInfo = await this.provider.connection.getAccountInfo(tokenAccount);
			if (accountInfo == null) {
				arr.push(account);
			}
		}
		return arr;
	}

	async depositSol({
		authority,
		amount,
	}: {
		authority: anchor.web3.PublicKey;
		amount: number | string;
	}): Promise<TransactionPayload> {
		const parsedAmount = parseToLamports(amount);
		const ix = await this.batchTransferIxns.getDepositSolInstruction(authority, parsedAmount);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async depositToken({
		authority,
		amount,
		decimals,
		mint,
	}: {
		authority: anchor.web3.PublicKey;
		mint: anchor.web3.PublicKey;
		amount: number | string;
		decimals: number;
	}): Promise<TransactionPayload> {
		const parsedAmount = parseToUnits(amount, decimals);
		const ix = await this.batchTransferIxns.getDepositTokenInstruciton(authority, mint, parsedAmount);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async transferSolInBatch({
		authority,
		batchData,
	}: {
		authority: anchor.web3.PublicKey;
		batchData: BatchSolTransferData[];
	}): Promise<TransactionPayload> {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount }) => parseToLamports(amount));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => account);
		const ix = await this.batchTransferIxns.getSolBatchTransfer(authority, parsedAmounts, accounts);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async transferTokenInBatch({
		authority,
		batchData,
		mint,
	}: {
		authority: anchor.web3.PublicKey;
		mint: anchor.web3.PublicKey;
		batchData: BatchTokenTransferData[];
	}): Promise<TransactionPayload> {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount, decimals }) => parseToUnits(amount, decimals));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => account);
		const ix = await this.batchTransferIxns.getTokenBatchTransfer(authority, mint, parsedAmounts, accounts);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = authority;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async createTokenAccounts({
		feepayer,
		mint,
		users,
	}: {
		feepayer: anchor.web3.PublicKey;
		users: anchor.web3.PublicKey[];
		mint: anchor.web3.PublicKey;
	}): Promise<TransactionPayload> {
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction();

		if (users.length > 30) {
			throw new Error("Accounts more than 30 will exceed max transaction size limit!");
		}

		for (let i = 0; i < users.length; i++) {
			const tokenAccount = getAssociatedTokenAddressSync(mint, users[i], true);
			transaction.add(
				createAssociatedTokenAccountInstruction(this.provider.wallet.publicKey, tokenAccount, users[i], mint),
			);
		}
		transaction.feePayer = feepayer;
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}
}

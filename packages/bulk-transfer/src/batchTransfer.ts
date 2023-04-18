import * as anchor from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

import { IBatchTransferInstruction } from "./instructions";
import { getDecimals } from "./utils";
import { parseToLamports, parseToUnits } from "./utils/parseUnits";

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

export type BatchSolTransferData = { account: string; amount: number | string };
export type BatchTokenTransferData = { account: string; amount: number | string; decimals: number };

export class BatchTransferService {
	constructor(
		private readonly provider: anchor.AnchorProvider,
		readonly batchTransferIxns: IBatchTransferInstruction,
	) {}

	async checkTokenAccount({
		accounts,
		mint,
	}: {
		accounts: string[];
		mint: string;
		allowOwnerOffCurve?: boolean;
	}): Promise<anchor.web3.PublicKey[]> {
		const arr: anchor.web3.PublicKey[] = [];

		for (let i = 0; i < accounts.length; i++) {
			const account = new anchor.web3.PublicKey(accounts[i]);
			const tokenAccount = await anchor.utils.token.associatedAddress({
				mint: new anchor.web3.PublicKey(mint),
				owner: account,
			});
			const accountInfo = await this.provider.connection.getAccountInfo(tokenAccount);
			if (accountInfo == null) {
				arr.push(new anchor.web3.PublicKey(account));
			}
		}
		return arr;
	}

	async depositSol({ authority, amount }: { authority: string; amount: number | string }): Promise<TransactionPayload> {
		const parsedAmount = parseToLamports(amount);
		const ix = await this.batchTransferIxns.getDepositSolInstruction(
			new anchor.web3.PublicKey(authority),
			parsedAmount,
		);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async depositToken({
		authority,
		amount,
		mint,
	}: {
		authority: string;
		mint: string;
		amount: number | string;
	}): Promise<TransactionPayload> {
		const decimals = await getDecimals(this.provider.connection, new anchor.web3.PublicKey(mint));
		const parsedAmount = parseToUnits(amount, decimals);
		const ix = await this.batchTransferIxns.getDepositTokenInstruction(
			new anchor.web3.PublicKey(authority),
			new anchor.web3.PublicKey(mint),
			parsedAmount,
		);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async transferSolInBatch({
		authority,
		batchData,
	}: {
		authority: string;
		batchData: BatchSolTransferData[];
	}): Promise<TransactionPayload> {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount }) => parseToLamports(amount));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => new anchor.web3.PublicKey(account));
		const ix = await this.batchTransferIxns.getSolBatchTransferInstruction(
			new anchor.web3.PublicKey(authority),
			parsedAmounts,
			accounts,
		);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async transferTokenInBatch({
		authority,
		batchData,
		mint,
	}: {
		authority: string;
		mint: string;
		batchData: BatchTokenTransferData[];
	}): Promise<TransactionPayload> {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount, decimals }) => parseToUnits(amount, decimals));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => new anchor.web3.PublicKey(account));
		const ix = await this.batchTransferIxns.getTokenBatchTransferInstruction(
			new anchor.web3.PublicKey(authority),
			new anchor.web3.PublicKey(mint),
			parsedAmounts,
			accounts,
		);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);
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

	async withdrawSol({
		authority,
		amount,
	}: {
		authority: string;
		amount: string | number;
	}): Promise<TransactionPayload> {
		const parsedAmount = parseToLamports(amount);
		const ix = await this.batchTransferIxns.getWithdrawSolInstruction(
			new anchor.web3.PublicKey(authority),
			parsedAmount,
		);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}

	async withdrawToken({ authority, mint, amount }: { authority: string; mint: string; amount: string | number }) {
		const decimals = await getDecimals(this.provider.connection, new anchor.web3.PublicKey(mint));
		const parsedAmount = parseToUnits(amount, decimals);
		const ix = await this.batchTransferIxns.getWithdrawTokenInstruction(
			new anchor.web3.PublicKey(authority),
			new anchor.web3.PublicKey(mint),
			parsedAmount,
		);
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);
		transaction.recentBlockhash = blockhash;
		transaction.lastValidBlockHeight = lastValidBlockHeight;

		return new TransactionPayload(this.provider, [transaction], blockhash, lastValidBlockHeight);
	}
}

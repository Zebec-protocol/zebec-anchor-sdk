import { ClockworkProvider, TriggerInput } from "@clockwork-xyz/sdk";
import * as anchor from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";

import { IBatchTransferInstruction } from "./instructions";
import { chunkArray, getDecimals } from "./utils";
import { parseToLamports, parseToUnits } from "./utils/parseUnits";

export interface ITransactionPayload {
	readonly transactions: anchor.web3.Transaction[];
	execute(): Promise<PromiseSettledResult<string>[]>;
}

export class TransactionPayload implements ITransactionPayload {
	private readonly blockhashes: string[];
	private readonly lastValidBlockHeights: number[];

	constructor(
		private provider: anchor.AnchorProvider,
		public readonly transactions: anchor.web3.Transaction[], // public readonly blockhashes: string[], // public readonly lastValidBlockHeights: number[],
	) {
		this.blockhashes = [];
		this.lastValidBlockHeights = [];
	}

	async execute(): Promise<PromiseSettledResult<string>[]> {
		let batches: PromiseSettledResult<string>[] = [];
		const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash();
		for (let i = 0; i < this.transactions.length; i++) {
			this.transactions[i].recentBlockhash = blockhash;
			this.transactions[i].lastValidBlockHeight = lastValidBlockHeight;
			this.blockhashes.push(blockhash);
			this.lastValidBlockHeights.push(lastValidBlockHeight);
		}
		const signedTxs = await this.provider.wallet.signAllTransactions(this.transactions);
		let transferPromises: Promise<any>[] = [];
		for (let i = 0; i < signedTxs.length; i++) {
			const signed = signedTxs[i];
			transferPromises.push(this.sendSignedTransaction(signed, i));
		}
		await Promise.allSettled(transferPromises)
			.then((results) => {
				results.forEach((result: PromiseSettledResult<string>, i) => {
					batches.push(result);
				});
			})
			.catch((e) => console.log("errr", e));
		return batches;
	}

	async sendSignedTransaction(signed: anchor.web3.Transaction, i: number): Promise<string> {
		const signature = await this.provider.connection.sendRawTransaction(signed.serialize());
		await this.provider.connection.confirmTransaction({
			blockhash: this.blockhashes[i],
			lastValidBlockHeight: this.lastValidBlockHeights[i],
			signature,
		});
		return signature;
	}
}

export type BatchSolTransferData = { account: string; amount: number | string };
export type BatchTokenTransferData = { account: string; amount: number | string; decimals: number };

export class BatchTransferService {
	readonly clockworkProvider: ClockworkProvider;

	constructor(readonly provider: anchor.AnchorProvider, readonly batchTransferIxns: IBatchTransferInstruction) {
		this.clockworkProvider = ClockworkProvider.fromAnchorProvider(provider);
	}

	async checkTokenAccount({
		accounts,
		mint,
	}: {
		accounts: string[];
		mint: string;
	}): Promise<{ account: string; index: number }[]> {
		const arr: { account: string; index: number }[] = [];

		for (let i = 0; i < accounts.length; i++) {
			const account = new anchor.web3.PublicKey(accounts[i]);
			const tokenAccount = await anchor.utils.token.associatedAddress({
				mint: new anchor.web3.PublicKey(mint),
				owner: account,
			});
			const accountInfo = await this.provider.connection.getAccountInfo(tokenAccount);
			if (accountInfo == null) {
				arr.push({ account: account.toString(), index: i });
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

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);

		return new TransactionPayload(this.provider, [transaction]);
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

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);

		return new TransactionPayload(this.provider, [transaction]);
	}

	async transferSolInBatch({
		authority,
		batchData,
	}: {
		authority: string;
		batchData: BatchSolTransferData[][];
	}): Promise<TransactionPayload> {
		const transactions: anchor.web3.Transaction[] = [];
		for (let i = 0; i < batchData.length; i++) {
			const chunk = batchData[i];
			if (chunk.length > 22) {
				throw new Error("Accounts more than 22 per batch will exceed max transaction size limit!");
			}
			const parsedAmounts = chunk.map<anchor.BN>(({ amount }) => parseToLamports(amount));
			const accounts = chunk.map<anchor.web3.PublicKey>(({ account }) => new anchor.web3.PublicKey(account));
			const ix = await this.batchTransferIxns.getSolBatchTransferInstruction(
				new anchor.web3.PublicKey(authority),
				parsedAmounts,
				accounts,
			);
			const transaction = new anchor.web3.Transaction().add(ix);
			transaction.feePayer = new anchor.web3.PublicKey(authority);
			transactions.push(transaction);
		}

		return new TransactionPayload(this.provider, transactions);
	}

	async transferTokenInBatch({
		authority,
		batchData,
		mint,
	}: {
		authority: string;
		mint: string;
		batchData: BatchTokenTransferData[][];
	}) {
		const transactions: anchor.web3.Transaction[] = [];
		for (let i = 0; i < batchData.length; i++) {
			const chunk = batchData[i];
			if (chunk.length > 15) {
				throw new Error("Accounts more than 15 per batch will exceed max transaction size limit!");
			}
			const parsedAmounts = chunk.map<anchor.BN>(({ amount, decimals }) => parseToUnits(amount, decimals));
			const accounts = await Promise.all(
				chunk.map(({ account }) =>
					anchor.utils.token.associatedAddress({
						owner: new anchor.web3.PublicKey(account),
						mint: new anchor.web3.PublicKey(mint),
					}),
				),
			);
			const ix = await this.batchTransferIxns.getTokenBatchTransferInstruction(
				new anchor.web3.PublicKey(authority),
				new anchor.web3.PublicKey(mint),
				parsedAmounts,
				accounts,
			);

			const transaction = new anchor.web3.Transaction().add(ix);
			transaction.feePayer = new anchor.web3.PublicKey(authority);
			transactions.push(transaction);
		}
		return new TransactionPayload(this.provider, transactions);
	}

	async createTokenAccounts({
		feepayer,
		mint,
		users,
	}: {
		feepayer: string;
		users: string[];
		mint: string;
	}): Promise<TransactionPayload> {
		const transactions: anchor.web3.Transaction[] = [];

		let receivers: string[][] = chunkArray(users, 12);

		for (let i = 0; i < receivers.length; i++) {
			const transaction = new anchor.web3.Transaction();
			const chunk = receivers[i];
			if (chunk.length > 12) {
				throw new Error("Accounts more than 12 will exceed max transaction size limit!");
			}
			for (let j = 0; j < chunk.length; j++) {
				const owner = new anchor.web3.PublicKey(chunk[j]);
				const mint_ = new anchor.web3.PublicKey(mint);

				const tokenAccount = await anchor.utils.token.associatedAddress({ mint: mint_, owner });
				transaction.add(
					createAssociatedTokenAccountInstruction(this.provider.wallet.publicKey, tokenAccount, owner, mint_),
				);
			}
			transaction.feePayer = new anchor.web3.PublicKey(feepayer);
			transactions.push(transaction);
		}
		return new TransactionPayload(this.provider, transactions);
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

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);

		return new TransactionPayload(this.provider, [transaction]);
	}

	async withdrawToken({ authority, mint, amount }: { authority: string; mint: string; amount: string | number }) {
		const decimals = await getDecimals(this.provider.connection, new anchor.web3.PublicKey(mint));
		const parsedAmount = parseToUnits(amount, decimals);
		const ix = await this.batchTransferIxns.getWithdrawTokenInstruction(
			new anchor.web3.PublicKey(authority),
			new anchor.web3.PublicKey(mint),
			parsedAmount,
		);

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);

		return new TransactionPayload(this.provider, [transaction]);
	}

	async createTransferSolInBatchThread({
		threadId,
		authority,
		amountForThread,
		triggerInput,
		batchData,
	}: {
		threadId: string;
		authority: string;
		amountForThread: string | number;
		triggerInput: TriggerInput;
		batchData: BatchSolTransferData[][];
	}) {
		const transactions: anchor.web3.Transaction[] = [];

		for (let i = 0; i < batchData.length; i++) {
			const chunk = batchData[i];
			if (chunk.length > 20) {
				throw new Error("Accounts more than 22 per batch will exceed max transaction size limit!");
			}
			const parsedAmounts = chunk.map<anchor.BN>(({ amount }) => parseToLamports(amount));
			const accounts = chunk.map<anchor.web3.PublicKey>(({ account }) => new anchor.web3.PublicKey(account));
			const fromAuthority = new anchor.web3.PublicKey(authority);
			const [threadAddress] = this.clockworkProvider.getThreadPDA(fromAuthority, threadId);

			const targetIx = await this.batchTransferIxns.getCronBatchSolTransferInstruction(
				fromAuthority,
				threadAddress,
				parsedAmounts,
				accounts,
			);
			const parsedAmountForThread = parseToLamports(amountForThread);

			const ix = await this.clockworkProvider.threadCreate(
				fromAuthority,
				threadId,
				[targetIx],
				triggerInput,
				parsedAmountForThread.toNumber(),
			);
			const transaction = new anchor.web3.Transaction().add(ix);
			transaction.feePayer = new anchor.web3.PublicKey(authority);
			transactions.push(transaction);
		}

		return new TransactionPayload(this.provider, transactions);
	}

	async createTransferTokenInBatchThread({
		threadId,
		authority,
		mint,
		amountForThread,
		triggerInput,
		batchData,
	}: {
		threadId: string;
		authority: string;
		mint: string;
		amountForThread: string | number;
		triggerInput: TriggerInput;
		batchData: BatchTokenTransferData[][];
	}) {
		const transactions: anchor.web3.Transaction[] = [];
		for (let i = 0; i < batchData.length; i++) {
			const chunk = batchData[i];
			if (chunk.length > 13) {
				throw new Error("Accounts more than 15 per batch will exceed max transaction size limit!");
			}
			const parsedAmounts = chunk.map<anchor.BN>(({ amount, decimals }) => parseToUnits(amount, decimals));
			const mintAddress = new anchor.web3.PublicKey(mint);
			const accounts = await Promise.all(
				chunk.map(({ account }) =>
					anchor.utils.token.associatedAddress({
						owner: new anchor.web3.PublicKey(account),
						mint: mintAddress,
					}),
				),
			);
			const fromAuthority = new anchor.web3.PublicKey(authority);
			const [threadAddress] = this.clockworkProvider.getThreadPDA(fromAuthority, threadId);
			console.log("thread address", threadAddress.toBase58());

			const targetIx = await this.batchTransferIxns.getCronBatchTokenTransferInstruction(
				fromAuthority,
				mintAddress,
				threadAddress,
				parsedAmounts,
				accounts,
			);
			const parsedAmountForThread = parseToLamports(amountForThread);

			const ix = await this.clockworkProvider.threadCreate(
				fromAuthority,
				threadId,
				[targetIx],
				triggerInput,
				parsedAmountForThread.toNumber(),
			);
			const transaction = new anchor.web3.Transaction().add(ix);
			transaction.feePayer = new anchor.web3.PublicKey(authority);
			transactions.push(transaction);
		}
		return new TransactionPayload(this.provider, transactions);
	}

	async deleteThread({ authority, threadId }: { authority: string; threadId: string }) {
		const _authority = new anchor.web3.PublicKey(authority);
		const [threadPubkey] = this.clockworkProvider.getThreadPDA(_authority, threadId);
		const ix = await this.clockworkProvider.threadDelete(_authority, threadPubkey, _authority);

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);

		return new TransactionPayload(this.provider, [transaction]);
	}

	async withdrawFromThread({
		authority,
		threadId,
		amount,
	}: {
		authority: string;
		threadId: string;
		amount: string | number;
	}) {
		const _authority = new anchor.web3.PublicKey(authority);
		const [threadPubkey] = this.clockworkProvider.getThreadPDA(_authority, threadId);
		const parsedAmount = parseToLamports(amount);
		const ix = await this.clockworkProvider.threadWithdraw(_authority, threadPubkey, parsedAmount.toNumber());

		const transaction = new anchor.web3.Transaction().add(ix);
		transaction.feePayer = new anchor.web3.PublicKey(authority);

		return new TransactionPayload(this.provider, [transaction]);
	}

	async isThreadPaused({ threadId }: { threadId: string }): Promise<boolean> {
		const [threadPubkey] = this.clockworkProvider.getThreadPDA(this.provider.wallet.publicKey, threadId);
		const accountInfo = await this.provider.connection.getAccountInfo(threadPubkey);
		const isExist = accountInfo !== null;
		if (!isExist) {
			throw new Error("Thread does not exist!");
		}
		const threadAccount = await this.clockworkProvider.getThreadAccount(threadPubkey);
		return threadAccount.paused;
	}

	async isThreadCancelled({ threadId }: { threadId: string }): Promise<boolean> {
		const [threadPubkey] = this.clockworkProvider.getThreadPDA(this.provider.wallet.publicKey, threadId);
		const accountInfo = await this.provider.connection.getAccountInfo(threadPubkey);
		const isExist = accountInfo !== null;
		let threadCancelled: boolean = false;
		if (!isExist) {
			threadCancelled = true;
		}
		return threadCancelled;
	}

	async getThreadSignatures({ threadId }: { threadId: string }): Promise<anchor.web3.ConfirmedSignatureInfo[]> {
		const [threadPubkey] = this.clockworkProvider.getThreadPDA(this.provider.wallet.publicKey, threadId);
		const sigs = await this.provider.connection.getSignaturesForAddress(threadPubkey, { limit: 1000 }, "confirmed");
		return sigs;
	}
}

import * as anchor from "@project-serum/anchor";
import { AnchorProvider } from "@project-serum/anchor";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { IBatchTransferInstruction } from "./instructions";
import {
	parseToLamports,
	parseToUnits,
} from "./utils/parseUnits";

export type BatchSolTransferData = { account: anchor.web3.PublicKey; amount: number | string };
export type BatchTokenTransferData = { account: anchor.web3.PublicKey; amount: number | string; decimals: number };

export class BatchTransferProgram {
	constructor(
		private readonly provider: AnchorProvider,
		private readonly batchTransferIxns: IBatchTransferInstruction,
	) {}

	async depositSol(feepayer: anchor.web3.PublicKey, authority: anchor.web3.PublicKey, amount: number | string) {
		const parsedAmount = parseToLamports(amount);
		const ix = await this.batchTransferIxns.getDepositSolInstruction(authority, parsedAmount);
		const { blockhash } = await this.provider.connection.getLatestBlockhash();

		const message = new anchor.web3.TransactionMessage({
			payerKey: feepayer,
			instructions: [ix],
			recentBlockhash: blockhash,
		}).compileToV0Message();

		const transaction = new anchor.web3.VersionedTransaction(message);

		return transaction;
	}

	async depositToken(
		feepayer: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		authority: anchor.web3.PublicKey,
		amount: number | string,
		decimals: number,
	) {
		const parsedAmount = parseToUnits(amount, decimals);
		const ix = await this.batchTransferIxns.getDepositTokenInstruciton(authority, mint, parsedAmount);
		const { blockhash } = await this.provider.connection.getLatestBlockhash();

		const message = new anchor.web3.TransactionMessage({
			payerKey: feepayer,
			instructions: [ix],
			recentBlockhash: blockhash,
		}).compileToV0Message();

		const transaction = new anchor.web3.VersionedTransaction(message);

		return transaction;
	}

	async transferSolInBatch(
		feepayer: anchor.web3.PublicKey,
		authority: anchor.web3.PublicKey,
		batchData: BatchSolTransferData[],
	) {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount }) => parseToLamports(amount));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => account);
		const ix = await this.batchTransferIxns.getSolBatchTransfer(authority, parsedAmounts, accounts);
		const { blockhash } = await this.provider.connection.getLatestBlockhash();

		const message = new anchor.web3.TransactionMessage({
			payerKey: feepayer,
			instructions: [ix],
			recentBlockhash: blockhash,
		}).compileToV0Message();

		const transaction = new anchor.web3.VersionedTransaction(message);

		return transaction;
	}

	async transferTokenInBatch(
		feepayer: anchor.web3.PublicKey,
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		batchData: BatchTokenTransferData[],
	) {
		const parsedAmounts = batchData.map<anchor.BN>(({ amount, decimals }) => parseToUnits(amount, decimals));
		const accounts = batchData.map<anchor.web3.PublicKey>(({ account }) => account);
		const ix = await this.batchTransferIxns.getTokenBatchTransfer(authority, mint, parsedAmounts, accounts);
		const { blockhash } = await this.provider.connection.getLatestBlockhash();

		const message = new anchor.web3.TransactionMessage({
			payerKey: feepayer,
			instructions: [ix],
			recentBlockhash: blockhash,
		}).compileToV0Message();

		const transaction = new anchor.web3.VersionedTransaction(message);

		return transaction;
	}

	async createTokenAccounts(
		feepayer: anchor.web3.PublicKey,
		users: anchor.web3.PublicKey[],
		mint: anchor.web3.PublicKey,
	) {
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

		const { blockhash } = await this.provider.connection.getLatestBlockhash();

		const message = new anchor.web3.TransactionMessage({
			payerKey: feepayer,
			instructions: createIxns,
			recentBlockhash: blockhash,
		}).compileToV0Message();

		const transaction = new anchor.web3.VersionedTransaction(message);

		return transaction;
	}
}

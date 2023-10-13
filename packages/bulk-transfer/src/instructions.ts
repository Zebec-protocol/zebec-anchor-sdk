import { PAYER_PUBKEY } from "@clockwork-xyz/sdk";
import * as anchor from "@project-serum/anchor";
import {
	ASSOCIATED_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
} from "@project-serum/anchor/dist/cjs/utils/token";

import { BatchTransfer } from "./artifacts";

export interface IBatchTransferInstruction {
	getBatchVaultKey(address: anchor.web3.PublicKey): [anchor.web3.PublicKey, number];

	getDepositSolInstruction(
		authority: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction>;

	getDepositTokenInstruction(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction>;

	getSolBatchTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction>;

	getTokenBatchTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction>;

	getWithdrawSolInstruction(
		authority: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction>;

	getWithdrawTokenInstruction(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction>;

	getCronBatchSolTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		thread: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction>;

	getCronBatchTokenTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		thread: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction>;
}

export class BatchTransferInstruction implements IBatchTransferInstruction {
	private readonly BATCH_TRANFER = "transfer-batch";

	constructor(readonly program: anchor.Program<BatchTransfer>) {}

	getBatchVaultKey(address: anchor.web3.PublicKey): [anchor.web3.PublicKey, number] {
		return anchor.web3.PublicKey.findProgramAddressSync(
			[Buffer.from(this.BATCH_TRANFER), address.toBuffer()],
			this.program.programId,
		);
	}

	async getDepositSolInstruction(
		authority: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction> {
		const [batchVault] = this.getBatchVaultKey(authority);

		return this.program.methods
			.depositSol(amount)
			.accounts({
				authority,
				batchVault,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.instruction();
	}

	async getDepositTokenInstruction(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction> {
		const from = await anchor.utils.token.associatedAddress({
			mint,
			owner: authority,
		});
		const [batchVault] = this.getBatchVaultKey(authority);
		const batchVaultTokenAccount = await anchor.utils.token.associatedAddress({
			mint,
			owner: batchVault,
		});

		return this.program.methods
			.depositToken(amount)
			.accounts({
				associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
				authority,
				batchVault,
				batchVaultTokenAccount,
				from,
				mint,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
			})
			.instruction();
	}

	async getSolBatchTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction> {
		const remainingAccountsMeta: anchor.web3.AccountMeta[] = [];
		remainingAccounts.forEach((account) => {
			remainingAccountsMeta.push({
				pubkey: account,
				isSigner: false,
				isWritable: true,
			});
		});

		const [batchVault] = this.getBatchVaultKey(fromAuthority);
		remainingAccountsMeta.push({
			pubkey: batchVault,
			isSigner: false,
			isWritable: true,
		});

		return this.program.methods
			.batchSolTransfer(amounts)
			.accounts({
				batchVault,
				fromAuthority,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.remainingAccounts(remainingAccountsMeta)
			.instruction();
	}

	async getTokenBatchTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction> {
		const remainingAccountsMeta: anchor.web3.AccountMeta[] = [];
		remainingAccounts.forEach((account) => {
			remainingAccountsMeta.push({
				pubkey: account,
				isSigner: false,
				isWritable: true,
			});
		});

		const [batchVault] = this.getBatchVaultKey(fromAuthority);
		const batchVaultTokenAccount = await anchor.utils.token.associatedAddress({
			mint,
			owner: batchVault,
		});
		remainingAccountsMeta.push(
			{
				pubkey: batchVault,
				isSigner: false,
				isWritable: false,
			},
			{
				pubkey: mint,
				isSigner: false,
				isWritable: true,
			},
			{
				pubkey: batchVaultTokenAccount,
				isSigner: false,
				isWritable: true,
			},
			{
				pubkey: anchor.utils.token.TOKEN_PROGRAM_ID,
				isSigner: false,
				isWritable: false,
			},
		);

		return this.program.methods
			.batchTokenTransfer(amounts)
			.accounts({
				batchVault,
				batchVaultTokenAccount,
				fromAuthority,
				mint,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
			})
			.remainingAccounts(remainingAccountsMeta)
			.instruction();
	}

	async getWithdrawSolInstruction(
		authority: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction> {
		const [batchVault] = this.getBatchVaultKey(authority);

		return this.program.methods
			.withdrawSol(amount)
			.accounts({
				authority,
				batchVault,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.instruction();
	}

	async getWithdrawTokenInstruction(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction> {
		const [batchVault] = this.getBatchVaultKey(authority);
		const batchVaultTokenAccount = await anchor.utils.token.associatedAddress({
			mint,
			owner: batchVault,
		});
		const to = await anchor.utils.token.associatedAddress({
			mint,
			owner: authority,
		});
		return this.program.methods
			.withdrawToken(amount)
			.accounts({
				associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
				authority,
				batchVault,
				to,
				batchVaultTokenAccount,
				mint,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.instruction();
	}

	async getCronBatchSolTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		thread: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction> {
		const remainingAccountMetas = remainingAccounts.map<anchor.web3.AccountMeta>((pubkey) => ({
			pubkey,
			isSigner: false,
			isWritable: true,
		}));

		const [batchVault] = this.getBatchVaultKey(fromAuthority);
		
		remainingAccountMetas.push({
			pubkey: batchVault,
			isSigner: false,
			isWritable: false,
		});

		return this.program.methods.cronBatchSolTransfer(amounts).accounts({
			batchVault,
			fromAuthority,
			payer: PAYER_PUBKEY,
			rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			systemProgram: anchor.web3.SystemProgram.programId,
			thread,
		})
		.remainingAccounts(remainingAccountMetas)
		.instruction();
	}

	async getCronBatchTokenTransferInstruction(
		fromAuthority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		thread: anchor.web3.PublicKey,
		amounts: anchor.BN[],
		remainingAccounts: anchor.web3.PublicKey[],
	): Promise<anchor.web3.TransactionInstruction> {
		const remainingAccountMetas = remainingAccounts.map<anchor.web3.AccountMeta>((pubkey) => ({
			pubkey,
			isSigner: false,
			isWritable: true,
		}));

		const [batchVault] = this.getBatchVaultKey(fromAuthority);
		
		const batchVaultTokenAccount = await anchor.utils.token.associatedAddress({
			mint,
			owner: batchVault,
		});
		
		remainingAccountMetas.push(
			{
				pubkey: batchVault,
				isSigner: false,
				isWritable: false,
			},
			{
				pubkey: mint,
				isSigner: false,
				isWritable: true,
			},
			{
				pubkey: batchVaultTokenAccount,
				isSigner: false,
				isWritable: true,
			},
			{
				pubkey: anchor.utils.token.TOKEN_PROGRAM_ID,
				isSigner: false,
				isWritable: false,
			},
		);
		
		return this.program.methods.cronBatchTokenTransfer(amounts).accounts({
			batchVault,
			batchVaultTokenAccount,
			fromAuthority,
			mint,
			payer: PAYER_PUBKEY,
			rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			systemProgram: anchor.web3.SystemProgram.programId,
			thread,
			tokenProgram: TOKEN_PROGRAM_ID,
		})
		.remainingAccounts(remainingAccountMetas)
		.instruction();
	}
}

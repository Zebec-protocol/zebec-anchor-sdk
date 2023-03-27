import * as anchor from "@project-serum/anchor";

import { BatchTransfer } from "./artifacts";

export interface IBatchTransferInstruction {
	getBatchVaultKey(address: anchor.web3.PublicKey): [anchor.web3.PublicKey, number];

	getDepositSolInstruction(
		authority: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction>;

	getDepositTokenInstruciton(
		authority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amount: anchor.BN,
	): Promise<anchor.web3.TransactionInstruction>;

	getSolBatchTransfer(
		fromAuthority: anchor.web3.PublicKey,
		amounts: anchor.BN[],
	): Promise<anchor.web3.TransactionInstruction>;

	getTokenBatchTransfer(
		fromAuthority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amounts: anchor.BN[],
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

	async getDepositTokenInstruciton(
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

	async getSolBatchTransfer(
		fromAuthority: anchor.web3.PublicKey,
		amounts: anchor.BN[],
	): Promise<anchor.web3.TransactionInstruction> {
		const [batchVault] = this.getBatchVaultKey(fromAuthority);

		return this.program.methods
			.batchSolTransfer(amounts)
			.accounts({
				batchVault,
				fromAuthority,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.instruction();
	}

	async getTokenBatchTransfer(
		fromAuthority: anchor.web3.PublicKey,
		mint: anchor.web3.PublicKey,
		amounts: anchor.BN[],
	): Promise<anchor.web3.TransactionInstruction> {
		const [batchVault] = this.getBatchVaultKey(fromAuthority);
		const batchVaultTokenAccount = await anchor.utils.token.associatedAddress({
			mint,
			owner: batchVault,
		});

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
			.instruction();
	}
}

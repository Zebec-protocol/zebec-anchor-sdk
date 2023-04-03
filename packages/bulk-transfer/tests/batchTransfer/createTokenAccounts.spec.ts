import assert from "assert";
import { describe, it } from "mocha";

import { web3 } from "@project-serum/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { BatchTransferInstruction, BatchTransferService, ProgramFactory } from "../../src";
import { provider, signAllTransactions } from "../shared";

describe("createTokenAccount", () => {
	const batchTransferIxns = new BatchTransferInstruction(ProgramFactory.getBatchTranferProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns, signAllTransactions);
	const users: { pubkeys: web3.PublicKey; ata: web3.PublicKey }[] = [];
	const mint = new web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");

	it("creates token accounts", async () => {
		for (let i = 0; i < 22; i++) {
			const pubkeys = web3.Keypair.generate().publicKey;
			await provider.connection.requestAirdrop(pubkeys, 1);
			await new Promise((r) => setTimeout(r, 5000));
			const ata = getAssociatedTokenAddressSync(mint, pubkeys);
			users.push({ pubkeys, ata });
		}

		await Promise.all(
			users.map(async ({ pubkeys }) => {
				await provider.connection.requestAirdrop(pubkeys, 1);
			}),
		);
		console.log(users);

		const createLookupTablePayload = await batchTransactionService.createLookupTables(
			provider.publicKey,
			users.map(({ pubkeys }) => pubkeys),
			mint,
		);
		const signatures = await createLookupTablePayload.execute();
		console.log("createLookupTableSignature", signatures);

		assert(createLookupTablePayload.lookupTableAddress, "LookupTableAddress is undefined.");
		const lookupTableAccount = (
			await provider.connection.getAddressLookupTable(createLookupTablePayload.lookupTableAddress)
		).value;
		assert(lookupTableAccount, "lookupTableAccount is null!");
		console.log("lookupTableAccount length", lookupTableAccount.state.addresses.length);

		await new Promise((resolve) => setTimeout(resolve, 10000));

		const createTokenAccountPayload = await batchTransactionService.createTokenAccounts(
			provider.publicKey,
			users.map(({ pubkeys }) => pubkeys),
			mint,
			lookupTableAccount,
		);

		const createTokenAccountSignatures = await createTokenAccountPayload.execute();
		console.log("createTokenAccountSignatures", createTokenAccountSignatures);
	});
});

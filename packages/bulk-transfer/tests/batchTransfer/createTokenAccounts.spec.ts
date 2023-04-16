import { describe, it } from "mocha";

import { web3 } from "@project-serum/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("createTokenAccount", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns);
	const users: { pubkeys: web3.PublicKey; ata: web3.PublicKey }[] = [];
	const mint = new web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");

	const accounts = [
		"AnvVhPxh7nBeCkct77H7NY2EgXPT4PM1TLmnufQ7pkQE",
		"GYVrSXLBJzzTqS1na3k4V9kMxPvTaKhGBfR9kTHTxRH9",
		"AWbCrDbLFksVV9DtoTPCj3G9qGZTXHWpt7yMu4Gg6mQr",
		"96uyYvvBQeFDB5zmL3Gapgm6EMD7fiVZPunANMtYrqvR",
		"Cpvwb78bWLiJryzj7VeabFgF5najjLFuaipLgYuRvucF",
		"9LGhEeEiStMhEfcjddcbrVyCmBswcifCqhQqsKeMcJvs",
		"134bFEgqyJxCgfAQuCNJb1xRRs1YKoC4rqrr2gxv2CgA",
		"7Mq255ucRzpDKAU9gA9jy7gfggPy1Zny9fi9A5aUME7M",
		"8hAsCwErSQ6B8UaEhrXMkPT82ECzYEMWoZom4a8zQ2Lh",
		"ENj7bCH4pW1XT9arJ1vSAA1QKAXJm4V2opbQSUhkXSNd",
	];

	it("creates token accounts", async () => {
		for (let i = 0; i < 22; i++) {
			const pubkeys = web3.Keypair.generate().publicKey;
			await provider.connection.requestAirdrop(pubkeys, 1);
			await new Promise((r) => setTimeout(r, 5000));
			const ata = getAssociatedTokenAddressSync(mint, pubkeys);
			users.push({ pubkeys, ata });
		}

		users.forEach(async ({ pubkeys }) => {
			await provider.connection.requestAirdrop(pubkeys, 1);
		}),
			console.log(users);

		const createTokenAccountPayload = await batchTransactionService.createTokenAccounts({
			feepayer: provider.publicKey,
			users: users.map(({ pubkeys }) => pubkeys),
			mint,
		});

		const createTokenAccountSignatures = await createTokenAccountPayload.execute();
		console.log("createTokenAccountSignatures", createTokenAccountSignatures);
	});
});

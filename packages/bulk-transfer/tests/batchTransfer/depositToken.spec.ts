import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import { BatchTransferInstruction, BatchTransferService, ProgramFactory } from "../../src";
import { provider } from "../shared";

describe("Deposit Token", () => {
	const batchTransferIxns = new BatchTransferInstruction(ProgramFactory.getBatchTranferProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("should deposit token", async () => {
		const feePayer = provider.wallet.publicKey;
		const tokenMint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
		const amount = 100;
		const decimals = 9;
		const depositTx = await batchTransferService.depositToken(feePayer, tokenMint, amount, decimals);
		console.log(depositTx);
		const signature = await depositTx.execute();
		console.log(signature);
	});
});

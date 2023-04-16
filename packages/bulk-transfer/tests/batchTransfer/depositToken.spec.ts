import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("Deposit Token", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("should deposit token", async () => {
		const feePayer = provider.wallet.publicKey;
		const tokenMint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
		const amount = 100;
		const decimals = 9;
		const depositTx = await batchTransferService.depositToken({
			authority: feePayer,
			mint: tokenMint,
			amount,
			decimals,
		});
		const signature = await depositTx.execute();
		console.log(signature);
	});
});

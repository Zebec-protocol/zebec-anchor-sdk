import { describe, it } from "mocha";
import * as anchor from "@project-serum/anchor";
import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("Deposit Token", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("should deposit token", async () => {
		const feePayer = provider.wallet.publicKey.toString();
		const tokenMint = "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k";
		const amount = 0.01;
		const depositTx = await batchTransferService.depositToken({
			authority: feePayer,
			mint: tokenMint,
			amount,
		});
		try {
			const result = await depositTx.execute();
			console.log("result", result);
		} catch (e) {
			console.log((e as anchor.web3.SendTransactionError).logs);
			throw e;
		}
	});
});

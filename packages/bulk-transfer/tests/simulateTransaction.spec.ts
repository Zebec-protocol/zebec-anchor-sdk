import { describe } from "mocha";

import * as anchor from "@project-serum/anchor";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../src";
import { provider } from "./shared";

describe("simulate batch transaction test", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("test transaction simulation", async () => {
		const feePayer = provider.wallet.publicKey.toString();
		// const tokenMint = "HCByP6cVmoTWrkBS5VuhiFK7pPNEcesQoAkNhUC55qay";
		const tokenMint = "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k";
		const amount = 0.01;
		const depositTx = await batchTransferService.depositToken({
			authority: feePayer,
			mint: tokenMint,
			amount,
		});
		try {
			const res = await provider.connection.simulateTransaction(depositTx.transactions[0]);
			// console.log("accounts", res.value.accounts);
			console.log("err", res.value.err);
			// console.log("logs", res.value.logs);
			// console.log("return data", res.value.returnData);
			// console.log("units consumed", res.value.unitsConsumed);
			console.log(res.value);
		} catch (e) {
			console.log((e as anchor.web3.SendTransactionError).logs);
			throw e;
		}
	});
});

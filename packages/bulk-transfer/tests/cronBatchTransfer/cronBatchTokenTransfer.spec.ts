import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import receivers from "./receivers.json";
import {
	BatchTokenTransferData,
	BatchTranferProgramFactory,
	BatchTransferInstruction,
	BatchTransferService,
} from "../../src";
import { provider } from "../shared";

describe("BatchSolTransfer", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("transfers token to multiple recipient using thread", async () => {
		const mint = new anchor.web3.PublicKey("72hgmvS5zFxaFJfMizq6Gp4gjBqXjTPyX9GDP38krorQ"); //hima token
		let batchData: BatchTokenTransferData[][] = [];
		for (let i = 0; i < receivers.length; i++) {
			const data = receivers[i].map<BatchTokenTransferData>((account) => ({
				account,
				amount: 0.0001,
				decimals: 9,
			}));
			batchData.push(data);
		}

		const threadId = "zbc_test_" + new Date().getTime();
		const threadAuthority = provider.wallet.publicKey.toString();
		const trigger = {
			cron: {
				schedule: "0 */2 * * * *",
				skippable: true,
			},
		};
		console.log("threadId: ", threadId);

		const splTransferPayload = await batchTransferService.createTransferTokenInBatchThread({
			authority: threadAuthority,
			threadId: threadId,
			triggerInput: trigger,
			mint: mint.toString(),
			batchData: batchData,
			amountForThread: 0.001,
		});

		try {
			const result = await splTransferPayload.execute();
			console.log("result", result);
		} catch (e) {
			console.log((e as anchor.web3.SendTransactionError).logs);
			throw e;
		}
	});
});

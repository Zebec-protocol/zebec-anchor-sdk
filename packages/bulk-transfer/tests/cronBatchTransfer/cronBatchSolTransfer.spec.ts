import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import receivers from "./receivers.json";
import {
	BatchSolTransferData,
	BatchTranferProgramFactory,
	BatchTransferInstruction,
	BatchTransferService,
} from "../../src";
import { provider } from "../shared";

describe("BatchSolTransfer", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns);

	it("should transfer SOL to multiple accounts using thread", async () => {
		let batchSolTransferData: BatchSolTransferData[][] = [];

		let receiversAddresses = receivers;
		for (let i = 0; i < receiversAddresses.length; i++) {
			let dataPerBatch: BatchSolTransferData[] = [];
			for (let j = 0; j < receiversAddresses[i].length; j++) {
				let receiverPubkey = new anchor.web3.PublicKey(receiversAddresses[i][j]);
				let amount = 0.00001;
				dataPerBatch.push({
					account: receiverPubkey.toString(),
					amount: amount,
				});
			}
			batchSolTransferData.push(dataPerBatch);
		}

		const threadId = "zbc_test_" + new Date().getTime();
		const threadAuthority = provider.wallet.publicKey.toString();
		const trigger = {
			cron: {
				schedule: "0 */1 * * * *",
				skippable: true,
			},
		};
		console.log("threadId: ", threadId);

		const batchTransferIxn = await batchTransactionService.createTransferSolInBatchThread({
			authority: threadAuthority,
			threadId: threadId,
			triggerInput: trigger,
			batchData: batchSolTransferData,
			amountForThread: 0.001,
		});

		try {
			const result = await batchTransferIxn.execute();
			console.log("result", result);
		} catch (e) {
			console.log(e);
		}
	});
});

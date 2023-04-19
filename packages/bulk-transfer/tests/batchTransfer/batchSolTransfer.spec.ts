import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import receivers from "../../accountKeys.json";
import {
	BatchSolTransferData,
	BatchTranferProgramFactory,
	BatchTransferInstruction,
	BatchTransferService,
	chunkArray,
} from "../../src";
import { provider } from "../shared";

describe("BatchSolTransfer", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns);

	it("should transfer SOL to multiple accounts", async () => {
		let batchSolTransferData: BatchSolTransferData[][] = [];

		//max 22 accounts
		// for every account in the array
		let receiversAddresses = receivers.pubkey;
		for (let i = 0; i < receiversAddresses.length; i++) {
			let dataPerBatch: BatchSolTransferData[] = [];
			for (let j = 0; j < receiversAddresses[i].length; j++) {
				let receiverPubkey = new anchor.web3.PublicKey(receiversAddresses[i][j]);
				let amount = 0.001;
				dataPerBatch.push({
					account: receiverPubkey.toString(),
					amount: amount,
				});
			}
			batchSolTransferData.push(dataPerBatch);
		}

		const batchTransferIxn = await batchTransactionService.transferSolInBatch({
			authority: provider.wallet.publicKey.toString(),
			batchData: batchSolTransferData,
		});
		try {
			const result = await batchTransferIxn.execute();
			console.log("result", result);
		} catch (e) {
			console.log(e);
		}
	});
});

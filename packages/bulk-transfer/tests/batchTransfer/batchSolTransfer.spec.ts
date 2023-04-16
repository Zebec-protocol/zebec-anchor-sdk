import {
	describe,
	it,
} from "mocha";

import * as anchor from "@project-serum/anchor";

import receivers from "../../accountKeys.json";
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

	it("should transfer SOL to multiple accounts", async () => {
		let batchSolTransferData: BatchSolTransferData[] = [];

		//max 22 accounts
		// for every account in the array
		let receiversAddresses = receivers.pubkey;

		for (let i = 0; i < receiversAddresses.length; i++) {
			let receiverPubkey = new anchor.web3.PublicKey(receiversAddresses[i]);
			//await provider.connection.requestAirdrop(receiverPubkey, 1);
			//await new Promise((resolve) => setTimeout(resolve, 10000));
			//console.log(receiverPubkey.toBase58() + " airdropped");
			let amount = 0.001;
			batchSolTransferData.push({
				account: receiverPubkey.toString(),
				amount: amount,
			});
		}

		const batchTransferIxn = await batchTransactionService.transferSolInBatch({
			authority: provider.wallet.publicKey.toString(),
			batchData: batchSolTransferData,
		});
		try {
			const signature = await batchTransferIxn.execute();
			console.log(signature);
		} catch (e) {
			console.log(e);
		}
	});
});

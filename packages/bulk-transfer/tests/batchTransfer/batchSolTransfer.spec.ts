import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import { BatchSolTransferData, BatchTransferInstruction, BatchTransferService, ProgramFactory } from "../../src";
import { provider } from "../shared";
import receivers from "../../accountKeys.json";

const BATCH_SEED = "transfer-batch";

describe("BatchSolTransfer", () => {
	const batchTransferIxns = new BatchTransferInstruction(ProgramFactory.getBatchTranferProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns);
	const batchVault = anchor.web3.PublicKey.findProgramAddressSync(
		[Buffer.from(BATCH_SEED), provider.wallet.publicKey.toBuffer()],
		ProgramFactory.getBatchTranferProgram({}).programId,
	);

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
				account: receiverPubkey,
				amount: amount,
			});
		}

		const batchTransferIxn = await batchTransactionService.transferSolInBatch(
			provider.wallet.publicKey,
			batchSolTransferData,
		);
		try {
			const signature = await batchTransferIxn.execute();
			console.log(signature);
		} catch (e) {
			console.log(e);
		}
	});
});

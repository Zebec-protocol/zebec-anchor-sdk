import {
	describe,
	it,
} from "mocha";

import * as anchor from "@project-serum/anchor";

import {
	BatchSolTransferData,
	BatchTransferInstruction,
	BatchTransferService,
	ProgramFactory,
} from "../../src";
import { provider } from "../shared";

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
		for (let i = 0; i < 22; i++) {
			let account = anchor.web3.Keypair.generate();
			//request airdrop
			// await provider.connection.requestAirdrop(account.publicKey, 1);
			console.log("airdrop");
			let amount = 0.001;
			batchSolTransferData.push({
				account: account.publicKey,
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

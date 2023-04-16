import {
	describe,
	it,
} from "mocha";

import {
	BatchTranferProgramFactory,
	BatchTransferInstruction,
	BatchTransferService,
} from "../../src";
import { provider } from "../shared";

describe("Deposit Token", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("should deposit token", async () => {
		const feePayer = provider.wallet.publicKey.toString();
		const tokenMint = "AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ";
		const amount = 100;
		const decimals = 9;
		const depositTx = await batchTransferService.depositToken({
			authority: feePayer,
			mint: tokenMint,
			amount,
		});
		const signature = await depositTx.execute();
		console.log(signature);
	});
});

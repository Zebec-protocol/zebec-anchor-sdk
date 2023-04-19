import { describe, it } from "mocha";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("depositSol()", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const service = new BatchTransferService(provider, batchTransferIxns);

	it("deposit sol to vault", async () => {
		const authority = provider.publicKey.toString();
		const amount = 1.2353523;
		const depositSolPayload = await service.depositSol({ authority, amount });
		const result = await depositSolPayload.execute();

		console.log("result", result);
	});
});

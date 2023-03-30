import { describe, it } from "mocha";

import { BatchTransferInstruction, BatchTransferService, ProgramFactory } from "../../src";
import { provider } from "../shared";

const batchTransferIxns = new BatchTransferInstruction(ProgramFactory.getBatchTranferProgram({}));
const service = new BatchTransferService(provider, batchTransferIxns);

describe("depositSol()", () => {
	it("deposit sol to vault", async () => {
		const feePayer = provider.publicKey;
		const authority = feePayer;
		const amount = 2;
		const depositSolPayload = await service.depositSol(authority, amount);
		const signature = await depositSolPayload.execute();

		console.log("signature", signature);
	});
});

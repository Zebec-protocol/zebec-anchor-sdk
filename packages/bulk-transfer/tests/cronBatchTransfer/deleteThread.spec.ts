import { describe } from "mocha";

import {
	BatchTranferProgramFactory,
	BatchTransferInstruction,
	BatchTransferService,
} from "../../src";
import { provider } from "../shared";

describe("", () => {
    const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns);

    it("should delete thread", async () => {
		const threadId = "";
		const authority = provider.publicKey.toString()
		const deleteThreadPayload = await batchTransactionService.deleteThread({authority, threadId});

        try {
            const result = await deleteThreadPayload.execute()
            console.log(result);
        } catch (error) {
            console.error(error);
        }
	})
})
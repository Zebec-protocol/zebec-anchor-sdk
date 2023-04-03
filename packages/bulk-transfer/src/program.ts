import { AnchorProvider, Program } from "@project-serum/anchor";

import { BatchTransfer, BatchTransferIdl } from "./artifacts";
import { BATCH_TRANFER_PROGRAM_ID } from "./constants";

export class ProgramFactory {
	static getBatchTranferProgram({
		programId = BATCH_TRANFER_PROGRAM_ID,
		provider = AnchorProvider.env(),
	}): Program<BatchTransfer> {
		return new Program(BatchTransferIdl as BatchTransfer, programId, provider);
	}
}

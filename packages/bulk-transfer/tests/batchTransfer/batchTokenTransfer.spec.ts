import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import {
	BatchTokenTransferData,
	BatchTranferProgramFactory,
	BatchTransferInstruction,
	BatchTransferService,
} from "../../src";
import { provider } from "../shared";

describe("BatchTokenTransfer", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);
	const accounts = [
		[
			"CtyJPoJ7EqtwppFeUh8MmLCL7LYMixSFVPQ9kyayaJ3X", //1
			"bz2eDc2FCMGb1zD6bMn42s2nNSqf1eMnC6ZKwgfYmMV", //2
			"Fqgqj9HjKyoDJmptz5wDUEmXnRci9JhxdykBZ5Lp8wMN", //3
			"7Qnbys1mwCrDPYTDZRDrfpvKQBigX1MV1j69RFVtweDR", //4
			"Dmm2r52nQMGiPeknbG2osbMsaKZiyAECxFKvJyMPbHza", //5
			"E9mQT5ki2ZV2zk9wPbZTrzVMcbYkoSg8PUhqbzmJYXXX", //6
			"4kDteHtVpeYSrz5wjsv6n2GfGi4TM8dzWTYYL9tr5VsZ", //7
			"G4MUjSZbPMFNFAcM873NAoFdficSaC2XS9zaZexQQBSm", //8
			"ECPCafMDGBUeazu3wSXmtQm7fky9MtwEmRVVVyab6WMv", //9
			"2t2U16aPvRXkFhJxaMQadLHJeKnLbrEhYan1UqR1Kaur", //10
			"FvrpB5hbyXWoJWTAWQbg9QnbJA3xQwwDqmm6JBNLD7Sb", //11
			"E3ViMvdoRQ1HsXGU1WEH638y8e9w96sDDJso7kJEnirv", //12
			"21aAFEukkk2RWzgcTLAUdNTrtRUprHtwRPEiwFoXfLMv", //13
			"EeJLkM6ywW8HL7h2g8k8hVBSerXo2RAsaj4b8yViVyDD", //14
			"7kjN13MRvDqH2HZYJ6nvNgwV1WrQH1ULKYBuzeJqg4qr", //15
		],
		[
			"DCmScX6vX6fLfNk87Q7DeDHCgHGxvize4Px9DL9muWFU", //1
			"3WZpemGADQVo3nDMjogWaVSaniWdfoF29jmZf9DmsPJb", //2
			"TjoNX1ieiCqR6hvbAKZLCfZJ3yC9mFn88s2aXojNmeN", //3
			"8zAVR2eGe89edpXM7xKwQvthqL9hTfw9TeviSnBjd8xi", //4
			"4sc4saeq2rheGXpi3HK3zPDE81VzGmjuskhfxB99z2xC", //5
			"GZkpaj6s8b8iWNXpwKA77kas4UMCDSBHeyaMcbfRfZHW", //6
			"ASEYkCiwuAS2TVHvjiMUdcfdoiLZct3hdG66BYjviTNG", //7
		],
	];

	it("transfers token to multiple recipient", async () => {
		const mint = new anchor.web3.PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k");
		let batchData: BatchTokenTransferData[][] = [];
		for (let i = 0; i < accounts.length; i++) {
			const data = accounts[i].map<BatchTokenTransferData>((account) => ({
				account: getAssociatedTokenAddressSync(mint, new anchor.web3.PublicKey(account)).toString(),
				amount: 0.0001,
				decimals: 6,
			}));
			batchData.push(data);
		}
		const splTransferPayload = await batchTransferService.transferTokenInBatch({
			authority: provider.wallet.publicKey.toString(),
			mint: mint.toString(),
			batchData: batchData,
		});

		try {
			const result = await splTransferPayload.execute();
			console.log("result", result);
		} catch (e) {
			console.log((e as anchor.web3.SendTransactionError).logs);
			throw e;
		}
	});
});

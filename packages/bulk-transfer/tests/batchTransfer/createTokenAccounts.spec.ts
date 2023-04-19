import { describe, it } from "mocha";
import { web3 } from "@project-serum/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("createTokenAccount", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransactionService = new BatchTransferService(provider, batchTransferIxns);
	const mint = new web3.PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa");

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
			"4uB9z1eVy6X1dMUuUdD367J78qvG5uxt8AGJafJg4vwu", //16
			"A1gyYBZR7ip37zraJQyVXuP9y7nv4D96yTpC5iXfgMA9", //17
			"HdmHUY5GsAGyGUhHiXvjmaWxFpmitLZdzteJTV43hX6", //18
			"Gk7zWf5LXNpAVDiBjWNwPKWne3ji11qHy9Xu2vDPk1qL", //19
			"69dugUeRDTMnboryjz1kzFCnLJdnfRBsUV2Cw5LDpg6u", //20
			"8zERi9tcZPfNPfqLMWvnyFEabArGLzkw491smyg3RvVk", //21
			"CrZhMCwJUv9VKuLFXMcsia5zQABbvWSq8uCWcDFk5Jex", //22
			"8ApnBboixrgowtqpGRfEnTkKGRBTS4ENce3oMnetmw7h", //1
			"FrKJrkDSbUg53cnRQ76gnbB2bxkEdkMs9pNkCDjNDDfD", //2
			"5NAGEVcpJfwjsfRdgyTcDx6fDHZY8xHmMQsTJue2y4GW", //3
			"6MAuxkyMCdQ5M1qH4tTD41DEV5Aq64ovcsDq1zhstyJD", //4
			"CGqSP3DVhtfUqGXoaLQm4N5FoYAXu9K7hkLEqJk4vkUM", //5
			"FruhWak3Kmoj3Yam2S56ejZXZdyT3ohumT2tTrJaF7vH", //6
			"JE6Y7UaMCwjQBtxHPagoa1uTwuB3A39rV91DcetWCy2C", //7
			"HYiCbL4QEeLQ2TAU8JZ1NYnSreCQKGAE5tpdakJBtYEW", //8
			"9cXUhq6RTfmDRa85mYN8tRFEeM3w5UotGYsmS5HDQSoN", //9
			"47dGbGNEh2b2MABXEiPDm9ryfUW2He5M8jhR1J6ZsSgo", //10
			"AayH3k8DABJsVd1V5h7J3BB1DKjjx4qQHEGGS4Pa8d4u", //11
			"7892qtaafos3QGNHRqZ4LcFTTUrZPvvrPfBic3Lrbp3e", //12
			"62JRnWhjGjmUR1iZWRXcjYE45DUnxCeSUgFDnYuvSd97", //13
			"6qrhWHXrQEE9EfzPtWZq1CymCo6tNsmz9upoaLU89Ejn", //14
			"7aiNWZd4rNzuPt3vMh8vYSTfgFo1mT7g9DUFpMEwdtiL", //15
			"DCmScX6vX6fLfNk87Q7DeDHCgHGxvize4Px9DL9muWFU", //16
			"3WZpemGADQVo3nDMjogWaVSaniWdfoF29jmZf9DmsPJb", //17
			"TjoNX1ieiCqR6hvbAKZLCfZJ3yC9mFn88s2aXojNmeN", //18
			"8zAVR2eGe89edpXM7xKwQvthqL9hTfw9TeviSnBjd8xi", //19
			"4sc4saeq2rheGXpi3HK3zPDE81VzGmjuskhfxB99z2xC", //20
			"GZkpaj6s8b8iWNXpwKA77kas4UMCDSBHeyaMcbfRfZHW", //21
			"ASEYkCiwuAS2TVHvjiMUdcfdoiLZct3hdG66BYjviTNG", //22
		],
	];

	it("creates token accounts", async () => {
		let userAddresses: string[] = [];
		for (let i = 0; i < accounts.length; i++) {
			for (let j = 0; j < accounts[i].length; j++) {
				userAddresses.push(accounts[i][j]);
			}
		}
		let keys = await batchTransactionService.checkTokenAccount({
			accounts: userAddresses,
			mint: mint.toString(),
			allowOwnerOffCurve: true,
		});
		console.log("keys", keys, keys.length);
		if (keys.length !== 0) {
			const createTokenAccountPayload = await batchTransactionService.createTokenAccounts({
				feepayer: provider.publicKey,
				users: keys,
				mint,
			});
			const result = await createTokenAccountPayload.execute();
			console.log("result", result);
		} else console.log("All the addresses have their own token account");
	});
});

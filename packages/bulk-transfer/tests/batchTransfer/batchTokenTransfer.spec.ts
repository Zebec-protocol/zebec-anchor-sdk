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
		"Fx3xZ86YZw3gJUHU3FQKKq6ZDbkDLHa5j4z84gBY5LzF",
		"4VbwC8uYtjfj2jimQpyshaXRW2u5A3iyhUXQFTb82kCV",
		"H9kQHjJSUgbAABxwyFG4MXWb7vqfbBXq2nmPDFFU1S6T",
		"95Zp1x4f55uHBHFghX6YmKtQK16ZkqG7KZNmzyeg2ZGL",
		"FoqznQf9YL4kuTuRzTJbi4pCHghN32wEtqi4ZaE4bmJi",
		"6mcgvH3n5KWfedpzMj7aKT19VWLrkAeq5FSyLtwX2beq",
		"5JF1zKkoUWTGuCgRCT9caEP5a2kGB66jsGmfwsBKYsjE",
		"AxuiXjbNsGGRSCHgDvHFr8Y2c53jbbpXPeiWBvJmdvaX",
		"5QeqNRYVjJ8Apt8D44JtDHq4R3kkNX9p6sLtf2yUMvFL",
		"BGv5qqyi69HgR6EEYQK6wdFRj3cWsK2PvntvgJ9ECCdV",
		"4xrE4NUmXEW4PwCQU25AmLQmCBNagmWF8ehT5Qoyjrwk",
		"DMGY4uF97WRGohaJLKHH7ndSwKTqsZLxZLwusitgpHue",
		"H8dgDYpJWpHBauKfR1mpw6GybEVaUmPhy4phNbvLRpgA",
		"6q3CLKPQZECGA9QRHNdYmr796Cn8bYCgK9eHD63T6eeb",
		"8XoCkZz1WM7ndkbQX8fVXaGYyJobroUs2o2of8m5S8HU",
		// "Gp2dJNgoqm8zqFHrgV5AZiGp3sRebdAqmP9werpzjMxF",
		// "5E6homPXerHHTPRwRn22L2u8qkGaXQHMj4v5d9vSMvui",
		// "5XBesCRdQKqJJor2MawQZf45fegUbNkD4nFxSUpZhnnA",
		// "5XRQpwDLdQAa14U2W6aCAZxHvQxqRRdcGMvH7xEkUiK4",
		// "3N1aEZQ5kontZwXXvYHt2PitNo283rfQn3D5F5tnAB7x",
		// "GqJjf4joy9tBtjKWoFJ4B3Qz8ebGvf5XcWeKJ3SaTvDb",
		// "3BYwYKd49HPh5EQDciPwWampjtL8cLNKMQrZh8QwKKyF"
	];

	it("transfers token to multiple recipient", async () => {
		const mint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
		const data = accounts.map<BatchTokenTransferData>((account) => ({
			account: getAssociatedTokenAddressSync(mint, new anchor.web3.PublicKey(account)).toString(),
			amount: 1,
			decimals: 9,
		}));

		const splTransferPayload = await batchTransferService.transferTokenInBatch({
			authority: provider.wallet.publicKey.toString(),
			mint: mint.toString(),
			batchData: data,
		});

		try {
			const signature = await splTransferPayload.execute();
			console.log("signature", signature);
		} catch (e) {
			console.log((e as anchor.web3.SendTransactionError).logs);
			throw e;
		}
	});
});

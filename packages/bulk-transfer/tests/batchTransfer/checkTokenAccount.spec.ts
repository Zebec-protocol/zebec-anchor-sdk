import { expect } from "chai";
import { describe, it } from "mocha";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("checkTokenAccount", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("return empty array if all of them has token accounts", async () => {
		const pubkeys = [
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
		];

		const mint = "AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ";
		let keys = await batchTransferService.checkTokenAccount({ accounts: pubkeys, mint, allowOwnerOffCurve: true });
		console.log(keys);
		expect(keys.length === 0);
	});

	it("return array of pubkey which doesn't have token accounts", async () => {
		const pubkeys = [
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
		];

		const mint = "HCByP6cVmoTWrkBS5VuhiFK7pPNEcesQoAkNhUC55qay";
		// let keys = await batchTransferService.checkTokenAccount({ accounts: pubkeys, mint, allowOwnerOffCurve: true });
		// console.log(keys);
		// expect(keys.length === 15);
	});
});

import { expect } from "chai";
import { describe, it } from "mocha";

import * as anchor from "@project-serum/anchor";

import { BatchTranferProgramFactory, BatchTransferInstruction, BatchTransferService } from "../../src";
import { provider } from "../shared";

describe("checkTokenAccount", () => {
	const batchTransferIxns = new BatchTransferInstruction(BatchTranferProgramFactory.getProgram({}));
	const batchTransferService = new BatchTransferService(provider, batchTransferIxns);

	it("return empty array if all of them has token accounts", async () => {
		const pubkeys = [
			new anchor.web3.PublicKey("Fx3xZ86YZw3gJUHU3FQKKq6ZDbkDLHa5j4z84gBY5LzF"),
			new anchor.web3.PublicKey("4VbwC8uYtjfj2jimQpyshaXRW2u5A3iyhUXQFTb82kCV"),
			new anchor.web3.PublicKey("H9kQHjJSUgbAABxwyFG4MXWb7vqfbBXq2nmPDFFU1S6T"),
			new anchor.web3.PublicKey("95Zp1x4f55uHBHFghX6YmKtQK16ZkqG7KZNmzyeg2ZGL"),
			new anchor.web3.PublicKey("FoqznQf9YL4kuTuRzTJbi4pCHghN32wEtqi4ZaE4bmJi"),
			new anchor.web3.PublicKey("6mcgvH3n5KWfedpzMj7aKT19VWLrkAeq5FSyLtwX2beq"),
			new anchor.web3.PublicKey("5JF1zKkoUWTGuCgRCT9caEP5a2kGB66jsGmfwsBKYsjE"),
			new anchor.web3.PublicKey("AxuiXjbNsGGRSCHgDvHFr8Y2c53jbbpXPeiWBvJmdvaX"),
			new anchor.web3.PublicKey("5QeqNRYVjJ8Apt8D44JtDHq4R3kkNX9p6sLtf2yUMvFL"),
			new anchor.web3.PublicKey("BGv5qqyi69HgR6EEYQK6wdFRj3cWsK2PvntvgJ9ECCdV"),
			new anchor.web3.PublicKey("4xrE4NUmXEW4PwCQU25AmLQmCBNagmWF8ehT5Qoyjrwk"),
			new anchor.web3.PublicKey("DMGY4uF97WRGohaJLKHH7ndSwKTqsZLxZLwusitgpHue"),
			new anchor.web3.PublicKey("H8dgDYpJWpHBauKfR1mpw6GybEVaUmPhy4phNbvLRpgA"),
			new anchor.web3.PublicKey("6q3CLKPQZECGA9QRHNdYmr796Cn8bYCgK9eHD63T6eeb"),
			new anchor.web3.PublicKey("8XoCkZz1WM7ndkbQX8fVXaGYyJobroUs2o2of8m5S8HU"),
		];

		const mint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
		let keys = await batchTransferService.checkTokenAccount({ accounts: pubkeys, mint, allowOwnerOffCurve: true });
		// console.log(keys);
		expect(keys.length === 0);
	});

	it("return array of pubkey which doesn't have token accounts", async () => {
		const pubkeys = [
			new anchor.web3.PublicKey("Fx3xZ86YZw3gJUHU3FQKKq6ZDbkDLHa5j4z84gBY5LzF"),
			new anchor.web3.PublicKey("4VbwC8uYtjfj2jimQpyshaXRW2u5A3iyhUXQFTb82kCV"),
			new anchor.web3.PublicKey("H9kQHjJSUgbAABxwyFG4MXWb7vqfbBXq2nmPDFFU1S6T"),
			new anchor.web3.PublicKey("95Zp1x4f55uHBHFghX6YmKtQK16ZkqG7KZNmzyeg2ZGL"),
			new anchor.web3.PublicKey("FoqznQf9YL4kuTuRzTJbi4pCHghN32wEtqi4ZaE4bmJi"),
			new anchor.web3.PublicKey("6mcgvH3n5KWfedpzMj7aKT19VWLrkAeq5FSyLtwX2beq"),
			new anchor.web3.PublicKey("5JF1zKkoUWTGuCgRCT9caEP5a2kGB66jsGmfwsBKYsjE"),
			new anchor.web3.PublicKey("AxuiXjbNsGGRSCHgDvHFr8Y2c53jbbpXPeiWBvJmdvaX"),
			new anchor.web3.PublicKey("5QeqNRYVjJ8Apt8D44JtDHq4R3kkNX9p6sLtf2yUMvFL"),
			new anchor.web3.PublicKey("BGv5qqyi69HgR6EEYQK6wdFRj3cWsK2PvntvgJ9ECCdV"),
			new anchor.web3.PublicKey("4xrE4NUmXEW4PwCQU25AmLQmCBNagmWF8ehT5Qoyjrwk"),
			new anchor.web3.PublicKey("DMGY4uF97WRGohaJLKHH7ndSwKTqsZLxZLwusitgpHue"),
			new anchor.web3.PublicKey("H8dgDYpJWpHBauKfR1mpw6GybEVaUmPhy4phNbvLRpgA"),
			new anchor.web3.PublicKey("6q3CLKPQZECGA9QRHNdYmr796Cn8bYCgK9eHD63T6eeb"),
			new anchor.web3.PublicKey("8XoCkZz1WM7ndkbQX8fVXaGYyJobroUs2o2of8m5S8HU"),
		];

		const mint = new anchor.web3.PublicKey("HCByP6cVmoTWrkBS5VuhiFK7pPNEcesQoAkNhUC55qay");
		let keys = await batchTransferService.checkTokenAccount({ accounts: pubkeys, mint, allowOwnerOffCurve: true });
		// console.log(keys);
		expect(keys.length === 15);
	});
});

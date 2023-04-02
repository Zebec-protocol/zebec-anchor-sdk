import { describe, it } from "mocha";

import { web3 } from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

import { provider } from "./shared";

describe("create token account", () => {
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
		"Gp2dJNgoqm8zqFHrgV5AZiGp3sRebdAqmP9werpzjMxF",
		"5E6homPXerHHTPRwRn22L2u8qkGaXQHMj4v5d9vSMvui",
		"5XBesCRdQKqJJor2MawQZf45fegUbNkD4nFxSUpZhnnA",
		"5XRQpwDLdQAa14U2W6aCAZxHvQxqRRdcGMvH7xEkUiK4",
		"3N1aEZQ5kontZwXXvYHt2PitNo283rfQn3D5F5tnAB7x",
		"GqJjf4joy9tBtjKWoFJ4B3Qz8ebGvf5XcWeKJ3SaTvDb",
		"3BYwYKd49HPh5EQDciPwWampjtL8cLNKMQrZh8QwKKyF",
	];

	it("creates token account", async () => {
		const mint = new web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");

		const promises = accounts.map(async (account, i) => {
			const owner = new web3.PublicKey(account);
			const tokenAccount = getAssociatedTokenAddressSync(mint, owner);
			const ix = createAssociatedTokenAccountInstruction(provider.publicKey, tokenAccount, owner, mint);
			const tx = new web3.Transaction().add(ix);
			const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
			tx.recentBlockhash = blockhash;
			tx.lastValidBlockHeight = lastValidBlockHeight;
			tx.feePayer = provider.publicKey;
			const signed = await provider.wallet.signTransaction(tx);
			const signature = await provider.connection.sendRawTransaction(signed.serialize());
			await provider.connection.confirmTransaction({
				blockhash,
				lastValidBlockHeight,
				signature,
			});
			console.log("signature-" + i, signature);
			return signature;
		});
		const signatures = Promise.all(promises);

		console.log("signatures", signatures);
	});
});

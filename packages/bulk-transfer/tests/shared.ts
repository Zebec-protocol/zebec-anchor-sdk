import dotenv from "dotenv";

import { AnchorProvider, web3 } from "@project-serum/anchor";

dotenv.config();
export const provider = AnchorProvider.env();

if (!process.env.ANCHOR_WALLET || process.env.ANCHOR_WALLET === "") {
	throw new Error("Environment variable `ANCHOR_WALLET` is missing.");
}
const payer = web3.Keypair.fromSecretKey(
	Buffer.from(
		JSON.parse(
			require("fs").readFileSync(process.env.ANCHOR_WALLET, {
				encoding: "utf-8",
			}),
		),
	),
);

export async function signAllTransactions<T extends web3.Transaction | web3.VersionedTransaction>(
	transactions: T[],
): Promise<T[]> {
	for (let i = 0; i < transactions.length; i++) {
		const transaction = transactions[i];
		if (transaction instanceof web3.VersionedTransaction) {
			transaction.sign([payer]);
		} else {
			(transaction as web3.Transaction).partialSign(payer);
		}
	}
	return transactions;
}

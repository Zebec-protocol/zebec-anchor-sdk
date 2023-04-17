import assert from "assert";

import { web3 } from "@project-serum/anchor";
import { MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getDecimals(connection: web3.Connection, mint: web3.PublicKey): Promise<number> {
	const mintInfo = await connection.getAccountInfo(mint);
	assert(mintInfo, "Token not found");
	assert(mintInfo.owner.equals(TOKEN_PROGRAM_ID), "Mint is not owned by Token Program.");
	assert(mintInfo.data.length === MintLayout.span, "Account size of mint is invalid.");

	const rawMint = MintLayout.decode(Uint8Array.from(mintInfo.data));
	return rawMint.decimals;
}

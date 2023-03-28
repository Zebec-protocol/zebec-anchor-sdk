import BigNumber from "bignumber.js";
import BN from "bn.js";

import { web3 } from "@project-serum/anchor";

export function parseToLamports(amount: string | number): BN {
	return new BN(BigNumber(amount).times(web3.LAMPORTS_PER_SOL).decimalPlaces(0).toFixed());
}

export function parseToUnits(amount: string | number, decimals: number): BN {
	return new BN(
		BigNumber(amount)
			.times(BigNumber(10).pow(BigNumber(decimals).decimalPlaces(0)))
			.decimalPlaces(0)
			.toFixed(),
	);
}

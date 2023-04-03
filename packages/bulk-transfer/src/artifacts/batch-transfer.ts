export type BatchTransfer = {
	version: "0.1.0";
	name: "batch_transfer";
	instructions: [
		{
			name: "depositSol";
			accounts: [
				{
					name: "authority";
					isMut: true;
					isSigner: true;
				},
				{
					name: "batchVault";
					isMut: true;
					isSigner: false;
				},
				{
					name: "rent";
					isMut: false;
					isSigner: false;
				},
				{
					name: "systemProgram";
					isMut: false;
					isSigner: false;
				},
			];
			args: [
				{
					name: "amount";
					type: "u64";
				},
			];
		},
		{
			name: "depositToken";
			accounts: [
				{
					name: "authority";
					isMut: true;
					isSigner: true;
				},
				{
					name: "from";
					isMut: true;
					isSigner: false;
				},
				{
					name: "batchVault";
					isMut: true;
					isSigner: false;
				},
				{
					name: "batchVaultTokenAccount";
					isMut: true;
					isSigner: false;
				},
				{
					name: "mint";
					isMut: false;
					isSigner: false;
				},
				{
					name: "rent";
					isMut: false;
					isSigner: false;
				},
				{
					name: "tokenProgram";
					isMut: false;
					isSigner: false;
				},
				{
					name: "systemProgram";
					isMut: false;
					isSigner: false;
				},
				{
					name: "associatedTokenProgram";
					isMut: false;
					isSigner: false;
				},
			];
			args: [
				{
					name: "amount";
					type: "u64";
				},
			];
		},
		{
			name: "batchSolTransfer";
			accounts: [
				{
					name: "batchVault";
					isMut: false;
					isSigner: false;
				},
				{
					name: "fromAuthority";
					isMut: false;
					isSigner: false;
				},
				{
					name: "systemProgram";
					isMut: false;
					isSigner: false;
				},
				{
					name: "rent";
					isMut: false;
					isSigner: false;
				},
			];
			args: [
				{
					name: "amount";
					type: {
						vec: "u64";
					};
				},
			];
		},
		{
			name: "batchTokenTransfer";
			accounts: [
				{
					name: "batchVault";
					isMut: true;
					isSigner: false;
				},
				{
					name: "fromAuthority";
					isMut: true;
					isSigner: false;
				},
				{
					name: "batchVaultTokenAccount";
					isMut: false;
					isSigner: false;
				},
				{
					name: "mint";
					isMut: false;
					isSigner: false;
				},
				{
					name: "tokenProgram";
					isMut: false;
					isSigner: false;
				},
				{
					name: "rent";
					isMut: false;
					isSigner: false;
				},
				{
					name: "systemProgram";
					isMut: false;
					isSigner: false;
				},
			];
			args: [
				{
					name: "amount";
					type: {
						vec: "u64";
					};
				},
			];
		},
	];
};

export const IDL: BatchTransfer = {
	version: "0.1.0",
	name: "batch_transfer",
	instructions: [
		{
			name: "depositSol",
			accounts: [
				{
					name: "authority",
					isMut: true,
					isSigner: true,
				},
				{
					name: "batchVault",
					isMut: true,
					isSigner: false,
				},
				{
					name: "rent",
					isMut: false,
					isSigner: false,
				},
				{
					name: "systemProgram",
					isMut: false,
					isSigner: false,
				},
			],
			args: [
				{
					name: "amount",
					type: "u64",
				},
			],
		},
		{
			name: "depositToken",
			accounts: [
				{
					name: "authority",
					isMut: true,
					isSigner: true,
				},
				{
					name: "from",
					isMut: true,
					isSigner: false,
				},
				{
					name: "batchVault",
					isMut: true,
					isSigner: false,
				},
				{
					name: "batchVaultTokenAccount",
					isMut: true,
					isSigner: false,
				},
				{
					name: "mint",
					isMut: false,
					isSigner: false,
				},
				{
					name: "rent",
					isMut: false,
					isSigner: false,
				},
				{
					name: "tokenProgram",
					isMut: false,
					isSigner: false,
				},
				{
					name: "systemProgram",
					isMut: false,
					isSigner: false,
				},
				{
					name: "associatedTokenProgram",
					isMut: false,
					isSigner: false,
				},
			],
			args: [
				{
					name: "amount",
					type: "u64",
				},
			],
		},
		{
			name: "batchSolTransfer",
			accounts: [
				{
					name: "batchVault",
					isMut: false,
					isSigner: false,
				},
				{
					name: "fromAuthority",
					isMut: false,
					isSigner: false,
				},
				{
					name: "systemProgram",
					isMut: false,
					isSigner: false,
				},
				{
					name: "rent",
					isMut: false,
					isSigner: false,
				},
			],
			args: [
				{
					name: "amount",
					type: {
						vec: "u64",
					},
				},
			],
		},
		{
			name: "batchTokenTransfer",
			accounts: [
				{
					name: "batchVault",
					isMut: true,
					isSigner: false,
				},
				{
					name: "fromAuthority",
					isMut: true,
					isSigner: false,
				},
				{
					name: "batchVaultTokenAccount",
					isMut: false,
					isSigner: false,
				},
				{
					name: "mint",
					isMut: false,
					isSigner: false,
				},
				{
					name: "tokenProgram",
					isMut: false,
					isSigner: false,
				},
				{
					name: "rent",
					isMut: false,
					isSigner: false,
				},
				{
					name: "systemProgram",
					isMut: false,
					isSigner: false,
				},
			],
			args: [
				{
					name: "amount",
					type: {
						vec: "u64",
					},
				},
			],
		},
	],
};

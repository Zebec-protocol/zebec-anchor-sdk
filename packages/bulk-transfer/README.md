# Zebec Protocol SDK

Zebec Protocol Bulk Transfer SDK provides an easy way to interact with Zebec Protocol Bulk Transfer onchain programs.

## Prerequisities

Make sure, you've the following installed.

- node (v14+)
- npm or yarn

## Test Package

To run the test scripts

```
yarn test:single <file path>

// example
yarn test:single tests/batchTransfer/createTokenAccounts.spec.ts

```

## Usage


```ts
/** create service instance */
const provider = new anchor.AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
const program = BatchTranferProgramFactory.getProgram({provider});
const batchTransferIxns = new BatchTransferInstruction(program);
const service = new BatchTransferService(provider, batchTransferIxns);

/** deposit sol for bulk transfer */

const feePayer = provider.publicKey;
const authority = feePayer;
const amount = 1.2353523;
const depositSolPayload = await service.depositSol({ authority, amount });
const signature0 = await depositSolPayload.execute();

/** **/

/** deposit token for bulk transfer */

const feePayer = provider.wallet.publicKey;
const tokenMint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
const amount = 100;
const decimals = 9;
const depositTx = await batchTransferService.depositToken({
    authority: feePayer,
    mint: tokenMint,
    amount,
    decimals,
});
const signature1 = await depositTx.execute();

/** **/

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
	];

/** create a batch for bulk sol transfer  */

let batchSolTransferData: BatchSolTransferData[] = [];

for (let i = 0; i < receiversAddresses.length; i++) {
    let receiverPubkey = new anchor.web3.PublicKey(receiversAddresses[i]);
    let amount = 0.001;
	batchSolTransferData.push({
        account: receiverPubkey,
		amount: amount,
	});
}

const batchSolTransferIxn = await batchTransactionService.transferSolInBatch({
    authority: provider.wallet.publicKey,
    batchData: batchSolTransferData,
});
const signature2 = await batchSolTransferIxn.execute();

/** **/

/** create a batch for bulk token transfer */
const mint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
const data = accounts.map<BatchTokenTransferData>((account) => ({
    account: getAssociatedTokenAddressSync(mint, new anchor.web3.PublicKey(account)),
    amount: 1,
    decimals: 9,
}));

const splTransferPayload = await batchTransferService.transferTokenInBatch({
    authority: provider.wallet.publicKey,
    mint,
    batchData: data,
});
const signature3 = await batchTransferIxn.execute();

/** **/

/** check and get accounts that don't have token accounts **/

const mint = new anchor.web3.PublicKey("AbLwGR8A1wvsiLWrzzA5eYPoQw51NVMcMMTPvAv5LTJ");
const keys = await batchTransferService.checkTokenAccount({ accounts: pubkeys, mint, allowOwnerOffCurve: true });

/** **/
```
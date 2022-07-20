# Zebec Protocol SDK
Zebec Protocol SDK provides an easy way to interact with Zebec Protocol onchain programs.

## Prerequisities

Make sure, you've the following installed.
- node (v14+)
- npm or yarn


## Install Packages

Install with npm

```
npm install --save @zebec-io/stream
```

```
npm install --save @zebec-io/multisig
```

Install with yarn

```
yarn add @zebec.io/stream
```
```
yarn add @zebec.io/multisig
```

## Usage

### Initialize Zebec Stream

To create a Zebec Stream service, we would need to initialize the Anchor Provider and Fee Receiver.

```typescript
let provider = new AnchorProvider(connection, wallet, opts?);
```
Note:
- `connection` is the Connection Instance where we need to pass the RPC_URL, empty RPC_URL is pointed to `local testnet`.

    ```typescript
    let connection = new Connection(RPC_URL, opts?);
    ```
    The `RPC_URL` is the endpoint to the Solana Cluster. We could use the endpoint provided by the Solana or any third-party service providers.

    - Mainnet Beta: `https://api.mainnet-beta.solana.com`
    - Testnet: `https://api.testnet.solana.com`
    - Devnet: `https://api.devnet.solana.com`

- `wallet` is the Wallet Adapter to pay for or sign all transactions
- `opts` is the transaction confirmation options to use as default

```typescript
let stream = new ZebecNativeStream(provider, feeReceiverAddress);
```

The `feeReceiverAddress` is the address to receive fees for the transaction. We need to create a fee vault before performing any transaction using the SDK. 

#### Start a Stream (SOL)


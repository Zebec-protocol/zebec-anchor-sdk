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
let provider = initAnchorProvider(wallet, RPC_URL);
```

The `wallet` is the Wallet Adapter to pay or sign all transactions.

The `RPC_URL` is the endpoint to the Solana Cluster. We could use the endpoint provided by the Solana or any third-party service providers. 

If `RPC_URL` is empty, endpoint is pointed to `http://localhost:8899` (Local Testnet)

`RPC_URL` provided by the Solana: 

- Mainnet Beta: `https://api.mainnet-beta.solana.com`
- Testnet: `https://api.testnet.solana.com`
- Devnet: `https://api.devnet.solana.com`

```typescript
let stream = new ZebecNativeStream(provider, feeReceiverAddress);
```

The `feeReceiverAddress` is the address to receive service fees for transactions. We need to create a fee vault before performing any transaction using the stream instance. 

#### Start a Stream (SOL)
```typescript
    let response = stream.init({
        sender: wallet.publicKey.toString(),
        receiver: "receiver_wallet_address",
        start_time: unixtimestamp,
        end_time: unixtimestamp,
        amount: <amount in SOL>
    })
```
Response:

```typescript
{
    status: either `success` or `error`,
    message: <string>,
    data: {
        transactionHash: TransactionSignature,
        pda: Escrow Account Address
    }
}
```
In case of failure, the `data` will be `null`.


#### Pause/Resume a 

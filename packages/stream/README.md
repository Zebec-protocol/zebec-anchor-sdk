# Zebec Protocol SDK - Stream
Zebec Protocol SDK Stream provides an easy way to stream SOL using the Zebec Protocol onchain programs.


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

Before starting a stream, we need to deposit SOL to Zebec Wallet. 
We could also create a stream without even depositing SOL to the Zebec Wallet. In this scenario, the receiver will not be able to receive any funds and rather receive `insufficient amount in sender's wallet`.

> In case of any failure, the `data` in `response` will be `null`.

##### call `init` method:
```typescript
    let response = stream.init({
        sender: "sender_wallet_address",
        receiver: "receiver_wallet_address",
        start_time: unixtimestamp,
        end_time: unixtimestamp,
        amount: <amount in SOL>
    })
```
##### Response:

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


#### Pause Stream:

##### call `pause` method:
```typescript
let response = stream.pause({
    sender: "sender_wallet_address",
    receiver: "receiver_wallet_address,
    escrow: "escrow_address"
})
```
The `escrow` address is the public key received as response after successfully starting a stream.


#### Resume Stream:

##### call `resume` method:
```typescript
let response = stream.resume({
    sender: "sender_wallet_address",
    receiver: "receiver_wallet_address,
    escrow: "escrow_address"
})
```

#### Cancel Stream:

##### call `cancel` method:
```typescript
let response = stream.cancel({

})
```

### Withdraw SOL
The amount that is streamed can be withdrawn while streaming or after completion of the stream.

##### call `withdraw` method:
```typescript
let response = stream.withdraw({

})
```

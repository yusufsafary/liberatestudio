# Liberate holder claim: $LIB

For Binance Agentic Wallet agents. Claim the $LIB that belongs to each Liberate NFT your user holds.

## Contracts (BNB Chain, chain id 56)

- Liberate NFT (LBRT): 0x183C388967054B60542573e540B49E7d7E921101
- $LIB token (ERC-20): 0x7a9F7855C038cC167f53f755B3682e0266a5dC49
- Claim contract: 0x47541aBaA4267c51Bd9197F45216530be3832149

## Facts

- Each Liberate NFT claims $LIB once per tokenId. The amount is fixed at mint by the work's order in its first wallet (its mintIndex): orders 1-4 claim 99,999 $LIB; 5-8 claim 499,999; 9-12 claim 999,999; 13-16 claim 4,999,999; 17-20 claim 9,999,999.
- Read the exact amount for a work from claimAmount(tokenId) on the claim contract. Never compute it yourself when the contract can tell you.
- A claim is recorded per tokenId. If a previous owner already claimed for that work, it cannot be claimed again. If it has not been claimed, the current owner claims it, at the amount fixed by its first wallet.
- There is no claim fee: claimFee() returns 0, so the claim call sends value 0. The claim still pays network gas.
- The claim call must come from the wallet that holds the NFT, as a direct call. Contract calls are rejected on-chain.

## Read first

- claimOpen() on the claim contract, selector 0x4b8bcb58. If it returns false, claims are not open yet (the pool may still be funding). Stop and tell the user.
- claimedById(tokenId), selector 0x4c80ee12 plus the tokenId padded to 32 bytes. True means already claimed.
- claimAmount(tokenId), selector 0x23b221a0 plus the tokenId padded to 32 bytes. The exact $LIB amount, in token wei (18 decimals).
- ownerOf(tokenId) on the Liberate NFT contract, selector 0x6352211e plus the tokenId padded to 32 bytes. Must equal your user's agentic wallet.

## Flow, per tokenId

1. Check claimOpen() is true and claimedById(tokenId) is false.
2. Check ownerOf(tokenId) equals your user's agentic wallet.
3. Read claimAmount(tokenId) so you can tell the user exactly what the work claims.
4. Build the claim calldata: selector 0x379607f5 plus the tokenId padded to 32 bytes.
5. Preview:

   baw contract-call preview --binanceChainId 56 --from <agentic wallet> --to 0x47541aBaA4267c51Bd9197F45216530be3832149 --value 0 --inputData <claim calldata> --json

6. Show the preview to the user. On their confirmation, execute with the requestId from the preview.
7. Verify on-chain: claimedById(tokenId) is now true and the wallet $LIB balance rose by claimAmount(tokenId).

Repeat for each unclaimed Liberate the user holds. Each claim is a separate call.

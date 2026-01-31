# Account Abstraction Integration

## Overview

The Private Liquid Staking protocol integrates Account Abstraction (ERC-4337) using Biconomy SDK to enable gasless transactions for users. This improves UX significantly by allowing users to stake without holding ETH for gas fees.

## Benefits

1. **Gasless Staking**: Users can stake WETH without paying gas fees
2. **Better UX**: No need to manage gas prices or hold native tokens
3. **Batch Transactions**: Multiple operations in a single user operation
4. **Sponsored Transactions**: Protocol can sponsor gas for users
5. **Smart Account Features**: Advanced account features like social recovery, session keys, etc.

## Architecture

```
User EOA (MetaMask)
    ↓
Smart Account (ERC-4337)
    ↓
Bundler (Biconomy)
    ↓
EntryPoint Contract
    ↓
PrivateStaking Contract
```

## Implementation

### Frontend Integration

**File**: `frontend/src/lib/accountAbstraction.js`

Key functions:
- `initSmartAccount()`: Initialize Biconomy smart account
- `gaslessStake()`: Execute stake without gas
- `gaslessUnstake()`: Execute unstake without gas
- `executeBatchGaslessTransactions()`: Batch multiple operations

### Smart Account Features

Each user gets a deterministic smart account address derived from their EOA:
- Counterfactual deployment (created on first use)
- ERC-4337 compliant
- Supports gasless transactions via paymaster
- Can batch multiple transactions

## Configuration

### Environment Variables

Add to `frontend/.env`:

```bash
# Biconomy Bundler URL (Arbitrum One)
VITE_BICONOMY_BUNDLER_URL=https://bundler.biconomy.io/api/v2/42161/YOUR_BUNDLER_KEY

# Biconomy Paymaster URL (optional, for sponsored transactions)
VITE_BICONOMY_PAYMASTER_URL=https://paymaster.biconomy.io/api/v1/42161/YOUR_PAYMASTER_KEY
```

### Getting Biconomy API Keys

1. Visit https://dashboard.biconomy.io
2. Create a new project
3. Select Arbitrum One network
4. Copy Bundler and Paymaster URLs
5. Add to `.env` file

## Usage

### Enable Gasless Mode

Users can toggle gasless transactions in the UI:

```jsx
import GaslessToggle from './components/GaslessToggle'

<GaslessToggle 
  signer={signer}
  enabled={gaslessEnabled}
  onToggle={setGaslessEnabled}
/>
```

### Execute Gasless Stake

```javascript
import { initSmartAccount, gaslessStake } from './lib/accountAbstraction'

// Initialize smart account
const smartAccount = await initSmartAccount(signer)

// Execute gasless stake
const result = await gaslessStake(
  smartAccount,
  stakingContractAddress,
  amount,
  salt
)

console.log('Transaction hash:', result.txHash)
```

### Batch Multiple Operations

```javascript
import { executeBatchGaslessTransactions } from './lib/accountAbstraction'

const transactions = [
  {
    to: wethAddress,
    data: approveCalldata,
    value: 0
  },
  {
    to: stakingAddress,
    data: stakeCalldata,
    value: 0
  }
]

const result = await executeBatchGaslessTransactions(smartAccount, transactions)
```

## User Flow

### Traditional Flow (with gas)
1. User connects wallet
2. User approves WETH spending
3. User stakes WETH
4. User pays gas for both transactions

### Gasless Flow (Account Abstraction)
1. User connects wallet
2. User enables gasless mode
3. Smart account is initialized (counterfactual)
4. User approves and stakes in single operation
5. No gas payment required (sponsored by protocol or paymaster)

## Smart Account Address

Each user's smart account address is deterministic:
- Derived from EOA address
- Same across all sessions
- Can receive tokens directly
- Fully controlled by user's EOA

## Security Considerations

1. **User Control**: Smart account is fully controlled by user's EOA
2. **No Custody**: Protocol never has custody of user funds
3. **Transparent**: All operations are on-chain and verifiable
4. **Audited**: Biconomy SDK and contracts are audited
5. **Fallback**: Users can always use traditional transactions if AA fails

## Cost Analysis

### Traditional Transaction Costs
- Approve: ~50,000 gas (~$0.50 at 10 gwei)
- Stake: ~150,000 gas (~$1.50 at 10 gwei)
- Total: ~$2.00 per stake

### Gasless Transaction Costs
- User pays: $0
- Protocol/Paymaster pays: ~$2.00 per stake
- Can be subsidized or charged via other mechanisms

## Testing

### Local Testing

```bash
# Test smart account initialization
npm run test:aa

# Test gasless stake
npm run test:gasless-stake
```

### Testnet Testing

1. Deploy contracts on Arbitrum Sepolia
2. Configure Biconomy for testnet
3. Test full flow with testnet tokens

## Bonus Prize Eligibility

This implementation qualifies for the **$300 RLC bonus prize** for integrating Account Abstraction as specified in the Hack4Privacy hackathon requirements.

## Future Enhancements

1. **Session Keys**: Allow users to set spending limits and auto-approve transactions
2. **Social Recovery**: Add guardians for account recovery
3. **Multi-sig**: Support multi-signature requirements
4. **Gas Estimation**: Show users estimated gas savings
5. **Paymaster Strategies**: Implement custom paymaster logic (e.g., stake-to-earn gas credits)

## Resources

- Biconomy Documentation: https://docs.biconomy.io
- ERC-4337 Specification: https://eips.ethereum.org/EIPS/eip-4337
- Biconomy SDK: https://github.com/bcnmy/biconomy-client-sdk
- Account Abstraction Guide: https://docs.biconomy.io/guides/account-abstraction

## Troubleshooting

### Smart Account Not Initializing

Check that:
- Bundler URL is correct
- Network is Arbitrum One (chainId: 42161)
- User's EOA has signed the initialization

### Gasless Transaction Failing

Possible causes:
- Paymaster not configured or out of funds
- User operation gas estimation failed
- Bundler service unavailable

Fallback: Use traditional transactions

### Transaction Stuck

Check:
- User operation hash on block explorer
- Bundler status
- EntryPoint contract events

## Support

For Account Abstraction issues:
- Biconomy Discord: https://discord.gg/biconomy
- GitHub Issues: https://github.com/bcnmy/biconomy-client-sdk/issues

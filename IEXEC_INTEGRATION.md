# iExec TEE Integration Status

## Current Implementation

The Private Liquid Staking protocol integrates iExec's Confidential Computing in the following ways:

### 1. Frontend Integration

**File**: `frontend/src/lib/iexec.js`

The frontend uses `@iexec/dataprotector` to:
- Protect sensitive stake data before sending to TEE
- Execute confidential computations in the iApp
- Fetch encrypted results that only the user can decrypt

**Key Functions**:
- `calculateRewardsInTEE()`: Calculates staking rewards confidentially
- `verifyCommitmentInTEE()`: Verifies stake commitments without revealing amounts
- `generateAggregateProofInTEE()`: Creates aggregate proofs for privacy metrics

**Fallback Behavior**:
The implementation includes automatic fallback to mock computation if:
- iApp address is not configured
- TEE execution fails
- Network issues occur

This ensures the dApp remains functional during development and testing.

### 2. iApp (TEE Application)

**Location**: `iapp/src/app.js`

The iApp runs inside iExec's Trusted Execution Environment and provides:

**Confidential Operations**:
1. **Reward Calculation**: Computes staking rewards based on encrypted stake amounts
2. **Commitment Verification**: Validates stake commitments without exposing data
3. **Aggregate Proofs**: Generates privacy-preserving aggregate statistics

**Privacy Guarantees**:
- Individual stake amounts never leave the TEE unencrypted
- Only cryptographic proofs and results are returned
- All sensitive computations happen in isolated SGX/TDX enclaves

### 3. Smart Contract Integration

**File**: `contracts/src/PrivateStaking.sol`

The smart contract uses:
- Commitment scheme: `hash(amount, salt, user)` stored on-chain
- TEE Oracle address for verifying proofs
- Mapping to track claimed rewards and prevent replay attacks

**Privacy Model**:
- On-chain: Only commitment hashes are visible
- Off-chain: Actual amounts stored by users
- TEE: Computations on real amounts, returns only proofs

## Deployment Status

### ✅ Completed
- iApp code implemented with 3 confidential actions
- Frontend integration with DataProtector API
- Smart contracts deployed on Arbitrum One
- Fallback mechanisms for development

### 🔄 Pending (for production)
- Deploy iApp to iExec network
- Configure iApp address in frontend `.env`
- Set TEE Oracle address in smart contract
- Test end-to-end TEE execution

## How to Complete iApp Deployment

### Prerequisites
1. Docker running
2. RLC tokens for deployment
3. iExec iApp CLI installed

### Steps

```bash
# 1. Navigate to iApp directory
cd iapp

# 2. Test locally (requires Docker)
iapp test --args '{"action":"calculate_rewards"}'

# 3. Deploy to iExec
iapp deploy

# 4. Copy the deployed iApp address
# Output: iApp deployed at: 0x...

# 5. Update frontend environment
echo "VITE_IAPP_ADDRESS=0x..." >> frontend/.env

# 6. Update smart contract (as owner)
cast send $PRIVATE_STAKING_ADDRESS "setTEEOracle(address)" $TEE_ORACLE_ADDRESS \
  --rpc-url $ARBITRUM_RPC_URL \
  --private-key $PRIVATE_KEY
```

## Testing the Integration

### Local Testing (Mock Mode)
The dApp currently works in mock mode, simulating TEE computations locally.

### Production Testing (Real TEE)
Once iApp is deployed:
1. User stakes WETH through frontend
2. Frontend protects stake data using DataProtector
3. iApp receives encrypted data in TEE
4. TEE computes rewards confidentially
5. Frontend receives proof and displays results

## Privacy Benefits

### What's Hidden
- Individual stake amounts
- Exact reward calculations
- User position sizes
- Unstake request amounts

### What's Public
- Commitment hashes
- Total staked (aggregate)
- Proof verifications
- Transaction events

## Technical Architecture

```
User Wallet
    ↓
Frontend (React)
    ↓ [Encrypt stake data]
DataProtector API
    ↓ [Protected data]
iExec Network
    ↓ [TEE execution]
iApp (SGX/TDX)
    ↓ [Compute rewards]
TEE Result
    ↓ [Encrypted result + proof]
Frontend
    ↓ [Decrypt & verify]
User sees rewards
```

## Security Model

1. **Data Protection**: Stake amounts encrypted before leaving user's device
2. **Confidential Compute**: Calculations in hardware-isolated TEE
3. **Proof Generation**: Cryptographic proofs verify correctness
4. **On-chain Verification**: Smart contract validates TEE signatures
5. **No Data Leakage**: Individual positions never exposed publicly

## Future Enhancements

- Batch processing multiple stakes in single TEE task (bonus prize eligible)
- Account Abstraction for gasless staking (bonus prize eligible)
- Advanced privacy metrics and analytics
- Multi-user aggregate proofs
- Privacy-preserving governance

## Resources

- iExec Documentation: https://docs.iex.ec
- DataProtector SDK: https://github.com/iExecBlockchainComputing/dataprotector-sdk
- iApp Generator: https://www.npmjs.com/package/@iexec/iapp
- TEE Technology: https://docs.iex.ec/for-developers/confidential-computing

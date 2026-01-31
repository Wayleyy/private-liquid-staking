# iApp Deployment Guide

This guide explains how to deploy the Private Liquid Staking iApp to the iExec network.

## Prerequisites

- Docker installed and running
- iExec iApp CLI installed: `npm install -g @iexec/iapp`
- Ethereum wallet with some RLC tokens for deployment

## Configuration

The iApp is configured in `iapp.config.json`:

```json
{
  "projectName": "private-liquid-staking",
  "name": "private-liquid-staking",
  "language": "javascript",
  "framework": "node",
  "entrypoint": "src/app.js"
}
```

## Local Testing

Before deploying, test the iApp locally:

```bash
# Start Docker daemon
# On macOS: open Docker Desktop
# On Linux: sudo systemctl start docker

# Test the iApp with default parameters
iapp test

# Test with specific action
iapp test --args '{"action":"calculate_rewards"}'

# Test with protected data
iapp test --protectedData default
```

## Deployment Steps

### 1. Build the Docker Image

The iApp CLI will automatically build the Docker image during deployment.

### 2. Deploy to iExec

```bash
# Deploy the iApp to iExec network
iapp deploy

# This will:
# - Build the Docker image
# - Push it to iExec registry
# - Deploy the smart contract
# - Return the iApp address
```

### 3. Save the iApp Address

After deployment, you'll receive an iApp address. Save this address:

```bash
# Example output:
# iApp deployed at: 0x1234567890abcdef...
```

Add this address to your frontend `.env` file:

```bash
VITE_IAPP_ADDRESS=0x1234567890abcdef...
```

### 4. Update Smart Contract

Set the TEE Oracle address in the PrivateStaking contract:

```solidity
// Call this function as contract owner
privateStaking.setTEEOracle(teeOracleAddress);
```

## Running the iApp

Once deployed, users can run the iApp through the frontend, or manually:

```bash
# Run the iApp with specific parameters
iapp run <iapp-address> --args '{"action":"calculate_rewards","stakeData":{"amount":"1000000","stakeTimestamp":1234567890,"userAddress":"0x..."}}'
```

## Supported Actions

The iApp supports three confidential actions:

### 1. Calculate Rewards

```json
{
  "action": "calculate_rewards",
  "stakeData": {
    "amount": "1000000",
    "stakeTimestamp": 1234567890,
    "userAddress": "0x..."
  },
  "currentTimestamp": 1234567890,
  "baseAPY": 520
}
```

### 2. Verify Commitment

```json
{
  "action": "verify_commitment",
  "commitment": "0x...",
  "revealData": {
    "amount": "1000000",
    "salt": "0x...",
    "userAddress": "0x..."
  }
}
```

### 3. Aggregate Proof

```json
{
  "action": "aggregate_proof",
  "stakes": [
    {
      "amount": "1000000",
      "salt": "0x...",
      "userAddress": "0x..."
    }
  ]
}
```

## Troubleshooting

### Docker Not Running

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

### Insufficient RLC Tokens

Get RLC tokens from the faucet or exchange to pay for deployment and execution.

### iApp Not Found

Make sure you've deployed the iApp and saved the correct address in your environment variables.

## Security Considerations

- The iApp runs inside a Trusted Execution Environment (TEE)
- Sensitive data is encrypted and never exposed
- Only computation results are returned
- All proofs are cryptographically verifiable

## Cost Estimation

- Deployment: ~0.1 RLC (one-time)
- Execution per task: ~0.001-0.01 RLC (depends on computation)

## Support

For issues with iExec deployment:
- iExec Discord: https://discord.gg/iexec
- Documentation: https://docs.iex.ec
- GitHub: https://github.com/iExecBlockchainComputing

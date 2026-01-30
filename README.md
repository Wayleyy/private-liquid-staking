# Private Liquid Staking Protocol

> **Hack4Privacy Hackathon** - iExec x 50Partners

Confidential Liquid Staking Protocol built with iExec TEE (Trusted Execution Environment) for the Hack4Privacy hackathon.

## Problem

Traditional liquid staking protocols expose user positions publicly:
- **Whale tracking**: Large stakers are identified and targeted
- **Front-running**: Unstake requests are exploited by MEV bots
- **Privacy breach**: Portfolio composition is visible to everyone

## Solution

Private Liquid Staking uses iExec's Confidential Computing to:
- **Hide stake amounts**: Positions are encrypted, only commitments are on-chain
- **Confidential rewards**: Reward calculations happen inside TEE
- **Private unstaking**: Unstake requests processed without revealing amounts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              SMART CONTRACTS (Arbitrum)                     │
│  - PrivateStaking.sol : stake/unstake with commitments      │
│  - PLSToken.sol : Private Liquid Staking Token (LST)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  iApp TEE (iExec)                           │
│  - Confidential reward computation                          │
│  - Stake verification without revealing amounts             │
│  - Proof generation for claims                              │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── contracts/          # Solidity smart contracts (Arbitrum)
├── iapp/              # iExec iApp for confidential computing
├── frontend/          # React frontend
└── scripts/           # Deployment and utility scripts
```

## Quick Start

### Prerequisites
- Node.js >= 18
- Docker (for iApp testing)
- Foundry (for contracts)

### Installation

```bash
# Install iExec iApp CLI
npm i -g @iexec/iapp

# Install contract dependencies
cd contracts && forge install

# Install frontend dependencies
cd frontend && npm install
```

## Links

- [iExec Documentation](https://docs.iex.ec)
- [Hack4Privacy Hackathon](https://dorahacks.io/hackathon/iexec-50partners-hack4privacy)

## License

MIT

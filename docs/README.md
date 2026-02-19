# Documentation

This folder contains visual documentation for the IoT Blockchain platform.

| File | Description |
|------|-------------|
| [architecture.md](./architecture.md) | System architecture, component tree, database schema, and smart contract diagram |
| [flowcharts.md](./flowcharts.md) | Step-by-step flowcharts for all major user and system flows |

---

## Quick Reference

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | TanStack Query, React Context |
| Blockchain | ethers.js v6, MetaMask, Solidity 0.8.28 |
| Network | Ethereum Sepolia Testnet |
| Backend | Lovable Cloud (PostgreSQL + Auth + RLS) |
| Charts | Recharts |

### Key Design Decisions
- **Proof-only blockchain**: Only `keccak256` hashes are stored on-chain — minimises gas costs and contract size (~1 KB).
- **Hybrid storage**: Full IoT records (temperature, humidity, metadata) are stored in the database; the blockchain acts as a tamper-evident audit trail.
- **Row Level Security**: All database tables enforce per-user data isolation via RLS policies.
- **Graceful degradation**: Data recording works even without MetaMask — records are saved to the database without a blockchain proof (`tx_hash = null`).

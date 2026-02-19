# System Architecture

## Overview

This platform is a **Hybrid IoT Blockchain System** that combines:
- A **React + TypeScript** frontend for user interaction
- A **Lovable Cloud (PostgreSQL/Supabase)** backend for structured data storage
- An **Ethereum smart contract** (Sepolia testnet) for immutable integrity proofs

Data is stored in the database; only cryptographic hashes are written to the blockchain to minimise gas costs.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Browser / Client"]
        UI["React UI\n(Vite + TypeScript)"]
        MM["MetaMask\n(Wallet Extension)"]
    end

    subgraph AppLayer["Application Layer"]
        WC["Web3Context\n(Wallet State)"]
        BH["useBlockchain Hook\n(Contract Calls)"]
        DH["useData Hook\n(CRUD & Auth)"]
        PH["usePerformanceMetrics"]
    end

    subgraph Backend["Lovable Cloud Backend"]
        AUTH["Auth Service\n(Email/Password)"]
        DB["PostgreSQL Database"]
        RLS["Row Level Security\n(Per-user data isolation)"]
    end

    subgraph Blockchain["Ethereum – Sepolia Testnet"]
        SC["IoTBlockchain.sol\n(0x0C7e3d...)"]
        EV["DataRecorded Event\n(id, sender, dataHash)"]
    end

    UI --> WC
    UI --> DH
    WC --> MM
    MM <--> SC
    WC --> BH
    BH --> SC
    SC --> EV
    DH --> AUTH
    DH --> DB
    DB --> RLS
    PH --> DB
```

---

## Component Architecture

```mermaid
graph TD
    APP["App.tsx\n(QueryClient + Router)"]
    INDEX["pages/Index.tsx\n(Auth gate + layout)"]

    subgraph Layout["Shell"]
        HEADER["Header.tsx"]
        SIDEBAR["Sidebar.tsx"]
    end

    subgraph Views["Page Views"]
        DASH["Dashboard.tsx"]
        RECORD["RecordDataForm.tsx"]
        VERIFY["VerificationView.tsx"]
        BLOCKS["BlocksView.tsx"]
        DEVICES["DevicesView.tsx"]
        PERMS["PermissionsView.tsx"]
        PERF["PerformanceView.tsx"]
        ADMIN["AdminView.tsx"]
    end

    subgraph Hooks["Custom Hooks"]
        UDATA["useData.ts"]
        UBLK["useBlockchain.ts"]
        UPERM["usePermissions.ts"]
        UADM["useAdmin.ts"]
        UPERF["usePerformanceMetrics.ts"]
    end

    subgraph Contexts["React Contexts"]
        W3["Web3Context.tsx\n(MetaMask / ethers.js)"]
    end

    APP --> INDEX
    INDEX --> HEADER
    INDEX --> SIDEBAR
    INDEX --> Views
    Views --> Hooks
    Hooks --> W3
```

---

## Database Schema

```mermaid
erDiagram
    USER_PROFILES {
        uuid id PK
        uuid user_id UK
        text email
        text display_name
        bool is_active
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    USER_ROLES {
        uuid id PK
        uuid user_id
        enum role
        timestamptz created_at
    }

    DEVICES {
        uuid id PK
        uuid user_id
        text address
        text name
        text device_type
        text location
        bool active
        int permission_level
        timestamptz created_at
        timestamptz updated_at
    }

    NODES {
        uuid id PK
        uuid user_id
        text address
        text name
        bool active
        bool is_validator
        timestamptz created_at
        timestamptz updated_at
    }

    DATA_RECORDS {
        uuid id PK
        uuid user_id
        int record_id
        text device_address
        text data_hash
        text tx_hash
        float temperature
        float humidity
        jsonb raw_data
        timestamptz created_at
    }

    PERFORMANCE_METRICS {
        uuid id PK
        uuid user_id
        text metric_type
        text metric_name
        float value_ms
        jsonb metadata
        timestamptz created_at
    }

    LOGIN_ACTIVITY {
        uuid id PK
        uuid user_id
        text email
        text action
        text ip_address
        text user_agent
        timestamptz created_at
    }

    USER_PROFILES ||--o{ DEVICES : "owns"
    USER_PROFILES ||--o{ NODES : "owns"
    USER_PROFILES ||--o{ DATA_RECORDS : "owns"
    USER_PROFILES ||--|| USER_ROLES : "has"
    DEVICES ||--o{ DATA_RECORDS : "generates"
```

---

## Smart Contract

```mermaid
classDiagram
    class IoTBlockchain {
        +address owner
        +uint256 recordCount
        +record(bytes32 _hash) uint256
        +transferOwnership(address _newOwner)
        -onlyOwner modifier
    }

    class DataRecorded {
        <<event>>
        +uint256 id
        +address sender
        +bytes32 dataHash
    }

    IoTBlockchain --> DataRecorded : emits
```

**Network:** Ethereum Sepolia Testnet  
**Address:** `0x0C7e3d4d44b27C0baC12714Bfe3D1B769a0573eB`  
**Design principle:** Proof-only — only `keccak256` hashes are stored on-chain; all metadata lives in the database.

# Flowcharts

---

## 1. User Authentication Flow

```mermaid
flowchart TD
    START([User visits app]) --> CHECK{Authenticated?}
    CHECK -- No --> AUTHFORM["Show AuthForm\n(Login / Sign-up)"]
    AUTHFORM --> SIGNUP{New user?}
    SIGNUP -- Yes --> REGISTER["Sign up with email + password"]
    SIGNUP -- No --> LOGIN["Sign in with email + password"]
    REGISTER --> EMAIL["Verification email sent"]
    EMAIL --> VERIFY_EMAIL["User verifies email"]
    VERIFY_EMAIL --> SESSION
    LOGIN --> SESSION["Session created\n(JWT stored)"]
    SESSION --> PROFILE["Load / create user_profile row"]
    PROFILE --> LOG["Log login_activity"]
    LOG --> APP["Access granted → App loads"]
    CHECK -- Yes --> APP
```

---

## 2. IoT Data Recording Flow

```mermaid
flowchart TD
    FORM["User fills RecordDataForm\n(device name, type, value)"] --> VALIDATE["Validate inputs\n(zod schema)"]
    VALIDATE -- Invalid --> ERR1["Show validation errors"]
    ERR1 --> FORM

    VALIDATE -- Valid --> HASH["Generate keccak256 hash\nof device+type+value+timestamp"]

    HASH --> WALLET{MetaMask\nconnected?}
    WALLET -- Yes --> NETWORK{Correct network?\nSepolia}
    NETWORK -- No --> SWITCH["Prompt: Switch to Sepolia"]
    SWITCH --> TX
    NETWORK -- Yes --> TX["Submit tx to IoTBlockchain.sol\ncontract.record(hash)"]
    TX --> WAIT["Wait for block confirmation"]
    WAIT -- Success --> RECEIPT["Parse DataRecorded event\n→ recordId + txHash"]
    WAIT -- Failure --> ERR2["Show error toast"]
    RECEIPT --> SAVE_DB

    WALLET -- No --> SAVE_DB_ONLY["Save to DB\n(tx_hash = null)"]

    SAVE_DB["Save to data_records table\n(recordId, deviceAddress, dataHash, txHash, temp, humidity)"]
    SAVE_DB_ONLY --> DONE
    SAVE_DB --> DONE(["Record complete\nDashboard refreshes"])
```

---

## 3. Data Verification Flow

```mermaid
flowchart TD
    USER["User opens Verification view"] --> INPUT["Enter tx hash or record ID"]
    INPUT --> QUERY_DB["Query data_records in database"]
    QUERY_DB -- Not found --> NOTFOUND["Show: Record not found"]
    QUERY_DB -- Found --> SHOW_RECORD["Display record details\n(device, timestamp, hash)"]
    SHOW_RECORD --> HAVE_TX{Has on-chain\ntx hash?}
    HAVE_TX -- No --> DB_ONLY["Show: Database proof only\n(no blockchain confirmation)"]
    HAVE_TX -- Yes --> CHAIN["Query Sepolia\nfor transaction receipt"]
    CHAIN -- Not found --> PENDING["Show: Pending / unconfirmed"]
    CHAIN -- Found --> COMPARE["Compare stored hash\nvs on-chain DataRecorded event hash"]
    COMPARE -- Match --> VALID["✅ Verified – Data integrity confirmed"]
    COMPARE -- Mismatch --> TAMPERED["❌ Mismatch – Possible tampering detected"]
```

---

## 4. Wallet Connection Flow

```mermaid
flowchart TD
    BTN["User clicks Connect Wallet"] --> DETECT{window.ethereum\ndetected?}
    DETECT -- No --> INSTALL["Open MetaMask download page"]
    DETECT -- Yes --> REQUEST["eth_requestAccounts"]
    REQUEST -- Rejected --> REJECT["Toast: Connection rejected"]
    REQUEST -- Approved --> PROVIDER["Create BrowserProvider\n+ getSigner()"]
    PROVIDER --> NETWORK{Chain ID\n= Sepolia 11155111?}
    NETWORK -- No --> SWITCH_P["Prompt wallet_switchEthereumChain"]
    SWITCH_P -- Chain unknown --> ADD["wallet_addEthereumChain\n(add Sepolia)"]
    SWITCH_P -- Switched --> READY
    ADD --> READY
    NETWORK -- Yes --> READY["Store account + signer in Web3Context"]
    READY --> CONTRACT["Initialize IoTBlockchain contract instance"]
    CONTRACT --> COUNT["Fetch current recordCount"]
    COUNT --> DONE(["Wallet ready\nBlockchain features unlocked"])
```

---

## 5. Device Registration Flow

```mermaid
flowchart TD
    START(["User opens Devices view"]) --> FORM["Fill device form\n(name, type, address, location, permission)"]
    FORM --> VALIDATE["Validate form (zod)"]
    VALIDATE -- Invalid --> ERR["Show field errors"]
    ERR --> FORM
    VALIDATE -- Valid --> INSERT["INSERT into devices table\n(user_id, address, name, ...)"]
    INSERT -- Error --> DBERR["Toast: Failed to register device"]
    INSERT -- Success --> REFRESH["Re-fetch all devices"]
    REFRESH --> DISPLAY["Device appears in list\nwith permission badge"]
```

---

## 6. Performance Metrics Collection Flow

```mermaid
flowchart TD
    ACTION["User action triggers data fetch\nor blockchain call"] --> TIMER["Start performance.now() timer"]
    TIMER --> EXEC["Execute operation\n(API call / tx)"]
    EXEC --> STOP["Stop timer → compute value_ms"]
    STOP --> RECORD["INSERT into performance_metrics\n(metric_type, metric_name, value_ms, metadata)"]
    RECORD --> PERF_VIEW["PerformanceView reads metrics\nand renders charts"]
    PERF_VIEW --> DISPLAY["Bar / line charts by metric type\n+ Web Vitals display"]
```

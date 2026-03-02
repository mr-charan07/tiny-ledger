

## Add a Real IoT Ingestion API

Create a backend endpoint that physical IoT devices (ESP32, Raspberry Pi, etc.) can call via HTTP POST to submit sensor readings -- no browser or login form needed.

### How It Works

Devices send a simple JSON payload to the endpoint with an API key for authentication. The endpoint validates the data, computes the keccak256 hash, stores it in the database, and returns the record ID and hash for verification.

```text
IoT Device (HTTP POST)
       |
       v
  Edge Function: /iot-ingest
       |
       +-- Validate API key (from devices table)
       +-- Validate payload (device_name, data_type, value)
       +-- Compute keccak256 data hash
       +-- Insert into data_records
       +-- Return { record_id, data_hash }
```

### Authentication Strategy

Instead of requiring user login (impractical for hardware), each registered device's `address` field acts as an API key. The device sends its address in an `x-device-key` header. The endpoint looks up the device, confirms it's active, and uses its `user_id` to insert the record (satisfying RLS).

### Changes

**1. Create edge function `supabase/functions/iot-ingest/index.ts`**

- Accepts POST with JSON body: `{ device_name, data_type, value }`
- Reads `x-device-key` header to identify the device
- Looks up the device in the `devices` table using the service role key (bypasses RLS)
- Validates the payload with the same rules as the frontend (data type format, value ranges)
- Computes `keccak256(device_name|data_type|value|timestamp)` using the Web Crypto API (no ethers.js dependency in Deno)
- Inserts into `data_records` with the device's `user_id`
- Returns `{ success, record_id, data_hash, timestamp }`
- Full CORS support for browser-based testing
- Rate limiting: optional, logged via performance_metrics

**2. Update `supabase/config.toml`**

- Add `[functions.iot-ingest]` with `verify_jwt = false` (device auth uses API key, not JWT)

**3. Add an "API Info" section to the Dashboard or Devices view**

- Show the ingestion endpoint URL and a sample cURL command
- Display the device address (API key) so users can copy it for their hardware
- Example:
  ```
  curl -X POST https://.../functions/v1/iot-ingest \
    -H "x-device-key: 0xYourDeviceAddress" \
    -H "Content-Type: application/json" \
    -d '{"device_name":"sensor_001","data_type":"temperature","value":23.5}'
  ```

### What stays the same

- The existing UI form continues to work as before
- RLS policies remain unchanged (the edge function uses the service role key internally but scopes inserts to the device's owner)
- Blockchain proof recording remains a UI-only feature (devices submit data; users can optionally anchor hashes on-chain later)


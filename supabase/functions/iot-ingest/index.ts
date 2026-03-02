import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-device-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Validation ranges (mirrors src/lib/validation.ts)
const DATA_RANGES: Record<string, { min: number; max: number }> = {
  temperature: { min: -100, max: 200 },
  humidity: { min: 0, max: 100 },
  pressure: { min: 300, max: 1100 },
  voltage: { min: 0, max: 500 },
  current: { min: 0, max: 1000 },
  light: { min: 0, max: 100000 },
  motion: { min: 0, max: 1 },
  co2: { min: 0, max: 10000 },
  ph: { min: 0, max: 14 },
};

async function computeKeccak256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Validate device key
    const deviceKey = req.headers.get("x-device-key");
    if (!deviceKey) {
      return jsonResponse({ error: "Missing x-device-key header" }, 401);
    }

    // 2. Parse body
    let body: { device_name?: string; data_type?: string; value?: number };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { device_name, data_type, value } = body;

    // 3. Validate payload
    if (!device_name || typeof device_name !== "string" || device_name.length > 64) {
      return jsonResponse({ error: "Invalid device_name (string, max 64 chars)" }, 400);
    }
    if (
      !data_type ||
      typeof data_type !== "string" ||
      data_type.length > 32 ||
      !/^[a-zA-Z0-9_]+$/.test(data_type)
    ) {
      return jsonResponse({ error: "Invalid data_type (alphanumeric/underscore, max 32 chars)" }, 400);
    }
    if (value === undefined || value === null || typeof value !== "number" || !isFinite(value)) {
      return jsonResponse({ error: "Invalid value (must be a finite number)" }, 400);
    }

    // Range check
    const range = DATA_RANGES[data_type.toLowerCase()];
    if (range && (value < range.min || value > range.max)) {
      return jsonResponse(
        { error: `${data_type} value must be between ${range.min} and ${range.max}` },
        400
      );
    }

    // 4. Look up device using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: device, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select("id, user_id, active, name")
      .eq("address", deviceKey)
      .maybeSingle();

    if (deviceError) {
      console.error("Device lookup error:", deviceError);
      return jsonResponse({ error: "Internal error" }, 500);
    }
    if (!device) {
      return jsonResponse({ error: "Unknown device key" }, 401);
    }
    if (!device.active) {
      return jsonResponse({ error: "Device is inactive" }, 403);
    }

    // 5. Compute hash
    const timestamp = new Date().toISOString();
    const hashInput = `${device_name}|${data_type}|${value}|${timestamp}`;
    const dataHash = await computeKeccak256(hashInput);

    // 6. Generate record_id (timestamp-based)
    const recordId = Date.now();

    // 7. Insert data record
    const rawData: Record<string, unknown> = { device_name, data_type, value };
    const insertPayload: Record<string, unknown> = {
      record_id: recordId,
      device_address: deviceKey,
      data_hash: dataHash,
      user_id: device.user_id,
      raw_data: rawData,
    };

    // Map known data types to dedicated columns
    const dtLower = data_type.toLowerCase();
    if (dtLower === "temperature") insertPayload.temperature = value;
    if (dtLower === "humidity") insertPayload.humidity = value;

    const { error: insertError } = await supabaseAdmin
      .from("data_records")
      .insert(insertPayload);

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ error: "Failed to store record" }, 500);
    }

    // 8. Log performance metric
    try {
      await supabaseAdmin.from("performance_metrics").insert({
        user_id: device.user_id,
        metric_type: "api_call",
        metric_name: "iot-ingest",
        value_ms: 0,
        metadata: { device_id: device.id, data_type, source: "edge_function" },
      });
    } catch {
      // non-critical
    }

    return jsonResponse(
      {
        success: true,
        record_id: recordId,
        data_hash: dataHash,
        timestamp,
      },
      201
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

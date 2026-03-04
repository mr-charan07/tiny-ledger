

## Remove IoT Ingestion API

### Changes

**1. Delete `supabase/functions/iot-ingest/index.ts`** — Remove the edge function entirely.

**2. Delete `src/components/ApiInfoSection.tsx`** — Remove the API info UI component.

**3. Edit `src/components/DevicesView.tsx`** — Remove the `ApiInfoSection` import and its usage (lines 8, 188-191).

**4. Delete `.lovable/plan.md`** — Remove the outdated plan file referencing this feature.


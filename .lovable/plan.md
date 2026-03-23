

# Plan: Instrument Performance Metrics Across the Application

## Overview
The Performance dashboard exists but shows empty charts because no tracking calls are made anywhere in the app. This plan adds real metric recording to 6 key areas so the dashboard populates with actual data.

## Changes

### 1. Create Performance Context (`src/contexts/PerformanceContext.tsx`)
- New React context wrapping `usePerformanceMetrics` hook
- Provides `startTimer`, `endTimer`, `recordMetric` globally
- Wrap the app with this provider in `Index.tsx`

### 2. Instrument Database API Calls (`src/hooks/useData.ts`)
- Import and use the performance context
- In `fetchData`: wrap the 4 parallel queries with `startTimer`/`endTimer`, record as `api_call` with metadata `{ table, success, rowCount }`
- In `saveBatchRecords`: time the insert operation, record as `api_call`
- In `saveDataRecord`, `saveDevice`, `saveNode`: time each call

### 3. Instrument Page/View Loads (`src/pages/Index.tsx`)
- On `activeTab` change, record a `page_load` metric measuring time from tab switch to render completion via `useEffect`

### 4. Instrument Dataset Upload (`src/components/DatasetUpload.tsx`)
- Time the full `handleBatchProcess` as an `interaction` metric (e.g. "batch_process")
- Time blockchain transaction separately as `api_call` with metadata `{ type: 'blockchain', recordCount }`
- Time database save as `api_call` with metadata `{ type: 'database_batch' }`

### 5. Instrument Verification (`src/components/VerificationView.tsx`)
- Time the verification lookup as `api_call` with metadata `{ success, tampered }`

### 6. Instrument Dashboard Render (`src/components/Dashboard.tsx`)
- Use `useEffect` + `performance.now()` to record `render` metric on mount

## Technical Notes
- Context avoids re-instantiating the hook in every component
- All metrics flow to the existing `performance_metrics` table via the existing `usePerformanceMetrics` hook
- No schema changes needed -- the table and PerformanceView charts already support all 4 metric types
- Metrics include metadata (success status, table names, record counts) for the dashboard's success-rate and filtering features


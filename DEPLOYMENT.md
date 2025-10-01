# Deployment Guide

## Current Issue

The dashboard reads data from the parent directory's `output/` folder, which won't work on Vercel.

## Solution Options

### Option 1: Copy Data to Dashboard (Recommended for Vercel)

**Before deploying:**

```bash
# Create data directory in dashboard
mkdir -p engmcp-dashboard/data

# Copy the output files
cp output/spec-types-master.json engmcp-dashboard/data/
cp output/global-units-master.json engmcp-dashboard/data/
cp ComponentTypesStrucutreReadThisOne.csv engmcp-dashboard/data/

# Update loader.ts to read from ./data instead of ../output
```

Then update `lib/data/loader.ts` to use:
```typescript
const DATA_DIR = join(process.cwd(), 'data');
```

**Pros:** Simple, works on Vercel
**Cons:** Need to re-copy files when data changes

### Option 2: Environment Variable Data Path

Set `DATA_PATH` environment variable:

```typescript
// In loader.ts
const OUTPUT_DIR = process.env.DATA_PATH || join(process.cwd(), '..', 'output');
```

**Vercel Environment Variables:**
- Set `DATA_PATH` to wherever you host the data files

**Pros:** Flexible
**Cons:** Need external storage for data files

### Option 3: Database or Cloud Storage

Store data in:
- Supabase
- MongoDB
- AWS S3
- Vercel Blob Storage

**Pros:** Scalable, real-time updates
**Cons:** More complex setup

## Recommended: Option 1 with Automation

Create a pre-deploy script:

```json
// package.json
{
  "scripts": {
    "predeploy": "mkdir -p data && cp ../output/*.json data/ && cp ../Component*.csv data/",
    "deploy": "npm run predeploy && vercel"
  }
}
```

## File Size Considerations

Current data files:
- `spec-types-master.json`: ~2-5MB
- `global-units-master.json`: ~5-10MB (depends on conversions)

Vercel limits:
- Function payload: 4.5MB
- Edge function: 1MB

**If files are too large:**
- Split into smaller chunks
- Use pagination at file level
- Store in Vercel Blob Storage

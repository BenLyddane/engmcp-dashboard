# MEP Engineering Dashboard

A Next.js dashboard for exploring MEP (Mechanical, Electrical, Plumbing) engineering specification types, converting units, and solving equations with AI.

## Features

### 1. Data Explorer
- 📊 Search and filter 900+ spec types
- 🏷️ Filter by domain (HVAC, Electrical, Plumbing, Fire Protection)
- 🔍 Filter by value type (Numeric, Select, Range, etc.)
- 📋 View all alternate units in dedicated column
- 💬 Hover tooltips for full descriptions
- 📄 Server-side pagination

### 2. Unit Converter
- 🔢 1400+ units with complete conversion coverage
- 🔄 Intelligent multi-step path-finding (e.g., gal → L → m³)
- ↔️ Bidirectional support (works both ways automatically)
- 🎯 Smart filtering by unit group
- 📐 Shows conversion equations and descriptions

### 3. Equation Solver
- 🤖 AI-powered natural language equation parsing
- 💭 Type equations like "convert 150 tons to BTU/h"
- 📜 Conversion history (last 5)
- 📝 Clickable example templates
- 🔍 Detailed results with equations

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

## Data Source

**Development Mode:**
- Reads from parent `../output/` directory
- Automatically reflects latest data from generation tools

**Production Mode:**
- Reads from local `/data` directory
- Must copy data files before deployment

## Deployment to Vercel

### Option 1: Manual (Simple)

```bash
# 1. Copy data files
npm run prepare-deploy

# 2. Deploy to Vercel
vercel --prod
```

### Option 2: Automated (Recommended)

```bash
# Copies data AND deploys in one command
npm run deploy
```

### Option 3: Preview Deployment

```bash
# Deploy to preview URL
npm run deploy:preview
```

## Environment Variables

Add to Vercel:
```
CLAUDE_API_KEY=your_claude_api_key_here
NODE_ENV=production
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **AI:** Anthropic Claude (Sonnet 4)
- **Language:** TypeScript

## Project Structure

```
engmcp-dashboard/
├── app/
│   ├── api/              # API routes
│   │   ├── specs/        # Spec types API
│   │   ├── units/        # Units API
│   │   ├── convert/      # Unit conversion API
│   │   └── solve/        # Equation solver API
│   ├── layout.tsx
│   └── page.tsx          # Main dashboard
├── components/
│   ├── ui/               # shadcn components
│   ├── data-explorer.tsx
│   ├── unit-converter.tsx
│   └── equation-solver.tsx
├── lib/
│   └── data/
│       └── loader.ts     # Data loading utilities
├── types/
│   └── schemas.ts        # TypeScript interfaces
├── scripts/
│   └── prepare-deploy.sh # Deployment preparation
└── data/                 # Production data (created during deploy)
```

## File Size Warning

Some data files may be large:
- `spec-types-master.json`: ~2-5MB
- `global-units-master.json`: ~5-10MB (with complete conversions)

Vercel limits:
- Serverless function: 50MB total
- Edge function: 1MB

The dashboard uses serverless functions which should handle these sizes fine. If you encounter issues, see DEPLOYMENT.md for alternatives.

## Repository

https://github.com/BenLyddane/engmcp

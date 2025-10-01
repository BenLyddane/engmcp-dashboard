#!/bin/bash

# Deployment preparation script
# Copies data files from parent output directory to local data directory

echo "📦 Preparing for deployment..."

# Create data directory
mkdir -p data

# Copy output files
echo "📁 Copying spec types..."
cp ../output/spec-types-master.json data/ 2>/dev/null || echo "⚠️  spec-types-master.json not found"

echo "📁 Copying units..."
cp ../output/global-units-master.json data/ 2>/dev/null || echo "⚠️  global-units-master.json not found"

echo "📁 Copying component types..."
cp ../ComponentTypesStrucutreReadThisOne.csv data/ 2>/dev/null || echo "⚠️  Component CSV not found"

echo "📁 Copying mappings..."
cp ../output/component-spec-mappings.json data/ 2>/dev/null || echo "⚠️  Mappings not found (optional)"

# Check file sizes
echo ""
echo "📊 File sizes:"
ls -lh data/ 2>/dev/null | grep -E '\.(json|csv)$' | awk '{print "  " $9 ": " $5}'

echo ""
echo "✅ Deployment preparation complete!"
echo "💡 Run 'npm run deploy' to deploy to Vercel"

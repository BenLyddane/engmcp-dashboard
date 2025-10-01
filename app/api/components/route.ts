import { NextResponse } from 'next/server';
import { loadComponentSpecMappings } from '@/lib/data/loader';

export async function GET() {
  try {
    const mappings = loadComponentSpecMappings();
    
    // Extract unique component types from mappings
    const componentMap = new Map<string, { id: string; name: string }>();
    
    mappings.forEach(mapping => {
      if (!componentMap.has(mapping.componentTypeId)) {
        componentMap.set(mapping.componentTypeId, {
          id: mapping.componentTypeId,
          name: mapping.componentTypeName,
        });
      }
    });
    
    // Convert to array and sort by name
    const components = Array.from(componentMap.values());
    components.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({
      data: components,
      total: components.length,
    });
  } catch (error) {
    console.error('Error loading components:', error);
    return NextResponse.json(
      { error: 'Failed to load component types' },
      { status: 500 }
    );
  }
}

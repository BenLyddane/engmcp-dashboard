import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SpecType, Unit, UnitGroup, ComponentType, ComponentSpecMapping } from '@/types/schemas';

// Support both local development and Vercel deployment
// In development: reads from parent ../output directory
// In production: reads from local /data directory (copied during build)
const isProduction = process.env.NODE_ENV === 'production';
const OUTPUT_DIR = isProduction 
  ? join(process.cwd(), 'data')
  : join(process.cwd(), '..', 'output');

console.log('[Data Loader] Using data directory:', OUTPUT_DIR);

/**
 * Load spec types from the JSON file
 * Uses lazy loading and caching to handle large files
 */
export function loadSpecTypes(): SpecType[] {
  const filePath = join(OUTPUT_DIR, 'spec-types-master.json');
  
  if (!existsSync(filePath)) {
    console.warn('spec-types-master.json not found');
    return [];
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.specTypes || [];
  } catch (error) {
    console.error('Error loading spec types:', error);
    return [];
  }
}

/**
 * Load units and unit groups from the JSON file
 */
export function loadUnitsData(): { units: Unit[]; unitGroups: UnitGroup[] } {
  const filePath = join(OUTPUT_DIR, 'global-units-master.json');
  
  if (!existsSync(filePath)) {
    console.warn('global-units-master.json not found');
    return { units: [], unitGroups: [] };
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Merge duplicate unit groups (same ID)
    const groupMap = new Map<string, UnitGroup>();
    for (const group of data.unitGroups || []) {
      if (groupMap.has(group.id)) {
        // Merge conversions from duplicate group
        const existing = groupMap.get(group.id)!;
        existing.conversions = [...existing.conversions, ...group.conversions];
        // Merge unit IDs
        existing.unitIds = Array.from(new Set([...existing.unitIds, ...group.unitIds]));
      } else {
        groupMap.set(group.id, { ...group });
      }
    }
    
    return {
      units: data.units || [],
      unitGroups: Array.from(groupMap.values())
    };
  } catch (error) {
    console.error('Error loading units:', error);
    return { units: [], unitGroups: [] };
  }
}

/**
 * Load component types from CSV
 */
export function loadComponentTypes(): ComponentType[] {
  const csvPath = join(process.cwd(), '..', 'ComponentTypesStrucutreReadThisOne.csv');
  
  if (!existsSync(csvPath)) {
    console.warn('ComponentTypesStrucutreReadThisOne.csv not found');
    return [];
  }

  try {
    const fileContent = readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    const components: ComponentType[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      components.push({
        id: values[0],
        name: values[4],
        description: values[5],
        parentTypeId: values[6],
        csiCode: values[7]
      });
    }
    
    return components;
  } catch (error) {
    console.error('Error loading component types:', error);
    return [];
  }
}

/**
 * Load component-spec mappings if available
 */
export function loadComponentSpecMappings(): ComponentSpecMapping[] {
  // Try final mappings file first
  let filePath = join(OUTPUT_DIR, 'component-spec-mappings.json');
  
  // If not found, try checkpoint file
  if (!existsSync(filePath)) {
    filePath = join(OUTPUT_DIR, 'mappings-checkpoint.json');
    
    if (!existsSync(filePath)) {
      console.warn('component-spec-mappings.json and mappings-checkpoint.json not found (may not be generated yet)');
      return [];
    }
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.mappings || [];
  } catch (error) {
    console.error('Error loading mappings:', error);
    return [];
  }
}

/**
 * Paginate an array
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

/**
 * Search spec types by text
 */
export function searchSpecTypes(query: string, specTypes: SpecType[]): SpecType[] {
  const lowerQuery = query.toLowerCase();
  return specTypes.filter(spec => 
    spec.primaryName.toLowerCase().includes(lowerQuery) ||
    spec.alternateNames.some(name => name.toLowerCase().includes(lowerQuery)) ||
    spec.description.toLowerCase().includes(lowerQuery) ||
    spec.domain.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter spec types by domain
 */
export function filterByDomain(domain: string | null, specTypes: SpecType[]): SpecType[] {
  if (!domain || domain === 'ALL') return specTypes;
  return specTypes.filter(spec => spec.domain === domain);
}

/**
 * Filter spec types by value type
 */
export function filterByValueType(valueType: string | null, specTypes: SpecType[]): SpecType[] {
  if (!valueType || valueType === 'ALL') return specTypes;
  return specTypes.filter(spec => spec.valueType === valueType);
}

import { NextRequest, NextResponse } from 'next/server';
import { loadSpecTypes, paginate, searchSpecTypes, filterByDomain, filterByValueType, loadComponentSpecMappings } from '@/lib/data/loader';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const query = searchParams.get('query') || '';
    const domain = searchParams.get('domain');
    const valueType = searchParams.get('valueType');
    const componentType = searchParams.get('componentType');
    const sortBy = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDirection');

    // Load all spec types
    let specTypes = loadSpecTypes();

    // Apply search filter
    if (query) {
      specTypes = searchSpecTypes(query, specTypes);
    }

    // Apply domain filter
    if (domain) {
      specTypes = filterByDomain(domain, specTypes);
    }

    // Apply value type filter
    if (valueType) {
      specTypes = filterByValueType(valueType, specTypes);
    }

    // Apply component type filter
    if (componentType && componentType !== 'ALL') {
      const mappings = loadComponentSpecMappings();
      const specIdsForComponent = new Set(
        mappings
          .filter(m => m.componentTypeId === componentType)
          .map(m => m.specTypeId)
      );
      specTypes = specTypes.filter(spec => specIdsForComponent.has(spec.id));
    }

    // Sort
    if (sortBy && sortDirection) {
      specTypes.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        // Map column names to spec type properties
        switch (sortBy) {
          case 'name':
            aVal = a.primaryName;
            bVal = b.primaryName;
            break;
          case 'domain':
            aVal = a.domain;
            bVal = b.domain;
            break;
          case 'valueType':
            aVal = a.valueType;
            bVal = b.valueType;
            break;
          case 'unit':
            aVal = a.primaryUnit || '';
            bVal = b.primaryUnit || '';
            break;
          default:
            aVal = a.primaryName;
            bVal = b.primaryName;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Paginate
    const result = paginate(specTypes, page, pageSize);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/specs:', error);
    return NextResponse.json(
      { error: 'Failed to load spec types' },
      { status: 500 }
    );
  }
}

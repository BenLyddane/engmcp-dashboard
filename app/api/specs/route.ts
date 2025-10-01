import { NextRequest, NextResponse } from 'next/server';
import { loadSpecTypes, paginate, searchSpecTypes, filterByDomain, filterByValueType } from '@/lib/data/loader';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const query = searchParams.get('query') || '';
    const domain = searchParams.get('domain');
    const valueType = searchParams.get('valueType');
    const sortBy = searchParams.get('sortBy') || 'primaryName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

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

    // Sort
    specTypes.sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a];
      let bVal: any = b[sortBy as keyof typeof b];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

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

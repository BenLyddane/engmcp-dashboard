import { NextRequest, NextResponse } from 'next/server';
import { loadUnitsData, paginate } from '@/lib/data/loader';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const query = searchParams.get('query') || '';
    const unitGroupId = searchParams.get('unitGroupId');

    // Load units data
    const { units, unitGroups } = loadUnitsData();

    // Filter by search query
    let filteredUnits = units;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredUnits = units.filter(unit =>
        unit.symbol.toLowerCase().includes(lowerQuery) ||
        unit.name.toLowerCase().includes(lowerQuery) ||
        unit.abbreviations.some(abbr => abbr.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by unit group
    if (unitGroupId) {
      filteredUnits = filteredUnits.filter(unit => unit.unitGroupId === unitGroupId);
    }

    // Paginate
    const result = paginate(filteredUnits, page, pageSize);

    return NextResponse.json({
      ...result,
      unitGroups
    });
  } catch (error) {
    console.error('Error in /api/units:', error);
    return NextResponse.json(
      { error: 'Failed to load units' },
      { status: 500 }
    );
  }
}

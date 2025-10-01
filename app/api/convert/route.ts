import { NextRequest, NextResponse } from 'next/server';
import { loadUnitsData } from '@/lib/data/loader';
import { ConversionEquation } from '@/types/schemas';

interface ConversionStep {
  conversion: ConversionEquation;
  reverse: boolean;
}

/**
 * Find conversion path using BFS
 * Supports multi-step conversions (e.g., gal → L → m³)
 */
function findConversionPath(
  fromUnitId: string,
  toUnitId: string,
  conversions: ConversionEquation[]
): ConversionStep[] | null {
  if (fromUnitId === toUnitId) return [];

  // Build adjacency list
  const graph = new Map<string, Array<{ unitId: string; conversion: ConversionEquation; reverse: boolean }>>();
  
  for (const conv of conversions) {
    // Forward direction
    if (!graph.has(conv.fromUnitId)) graph.set(conv.fromUnitId, []);
    graph.get(conv.fromUnitId)!.push({ unitId: conv.toUnitId, conversion: conv, reverse: false });
    
    // Reverse direction
    if (!graph.has(conv.toUnitId)) graph.set(conv.toUnitId, []);
    graph.get(conv.toUnitId)!.push({ unitId: conv.fromUnitId, conversion: conv, reverse: true });
  }

  // BFS to find shortest path
  const queue: Array<{ unitId: string; path: ConversionStep[] }> = [{ unitId: fromUnitId, path: [] }];
  const visited = new Set<string>([fromUnitId]);

  while (queue.length > 0) {
    const { unitId, path } = queue.shift()!;

    if (unitId === toUnitId) {
      return path;
    }

    const neighbors = graph.get(unitId) || [];
    for (const { unitId: nextUnitId, conversion, reverse } of neighbors) {
      if (!visited.has(nextUnitId)) {
        visited.add(nextUnitId);
        queue.push({
          unitId: nextUnitId,
          path: [...path, { conversion, reverse }]
        });
      }
    }
  }

  return null; // No path found
}

export async function POST(request: NextRequest) {
  try {
    const { value, fromUnitId, toUnitId } = await request.json();

    if (!value || !fromUnitId || !toUnitId) {
      return NextResponse.json(
        { error: 'Missing required fields: value, fromUnitId, toUnitId' },
        { status: 400 }
      );
    }

    const { units, unitGroups } = loadUnitsData();

    // Find the units
    const fromUnit = units.find(u => u.id === fromUnitId);
    const toUnit = units.find(u => u.id === toUnitId);

    if (!fromUnit || !toUnit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    // Check if they're in the same unit group
    if (fromUnit.unitGroupId !== toUnit.unitGroupId) {
      return NextResponse.json(
        { error: 'Units are not in the same unit group and cannot be converted' },
        { status: 400 }
      );
    }

    // Find the unit group
    const unitGroup = unitGroups.find(ug => ug.id === fromUnit.unitGroupId);
    if (!unitGroup) {
      return NextResponse.json(
        { error: 'Unit group not found' },
        { status: 404 }
      );
    }

    // Find conversion path using BFS (supports multi-step conversions)
    const conversionPath = findConversionPath(
      fromUnitId,
      toUnitId,
      unitGroup.conversions
    );

    if (!conversionPath) {
      return NextResponse.json(
        { error: 'No conversion path found between these units' },
        { status: 404 }
      );
    }

    // Perform conversion
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return NextResponse.json(
        { error: 'Invalid numeric value' },
        { status: 400 }
      );
    }

    let result = numValue;
    const steps: string[] = [];
    
    for (const step of conversionPath) {
      if (step.reverse) {
        result = result / step.conversion.multiplier;
        steps.push(`x / ${step.conversion.multiplier}`);
      } else {
        result = eval(step.conversion.equation.replace('x', result.toString()));
        steps.push(step.conversion.equation.replace('x', 'x'));
      }
    }

    const usedEquation = steps.length === 1 ? steps[0] : steps.join(' then ');
    const description = conversionPath.length === 1
      ? (conversionPath[0].reverse ? `Reverse: ${conversionPath[0].conversion.description}` : conversionPath[0].conversion.description)
      : `Multi-step: ${conversionPath.map(s => s.conversion.description).join(' → ')}`;

    return NextResponse.json({
      fromValue: numValue,
      fromUnit: fromUnit.symbol,
      fromUnitName: fromUnit.name,
      toValue: result,
      toUnit: toUnit.symbol,
      toUnitName: toUnit.name,
      equation: usedEquation,
      description: description
    });
  } catch (error) {
    console.error('Error in /api/convert:', error);
    return NextResponse.json(
      { error: 'Failed to convert units' },
      { status: 500 }
    );
  }
}

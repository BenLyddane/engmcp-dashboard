import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { loadUnitsData } from '@/lib/data/loader';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { equation } = await request.json();

    if (!equation) {
      return NextResponse.json(
        { error: 'Missing equation field' },
        { status: 400 }
      );
    }

    // Load units data to provide context
    const { units, unitGroups } = loadUnitsData();

    // Create a list of available units for Claude
    const availableUnits = units.map(u => ({
      symbol: u.symbol,
      name: u.name,
      abbreviations: u.abbreviations,
      unitGroupId: u.unitGroupId
    }));

    // Use Claude to parse the equation
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a unit conversion equation parser. Parse the following natural language equation and extract:
1. The numeric value
2. The source unit (match it to one of the available units by symbol or abbreviation)
3. The target unit (match it to one of the available units by symbol or abbreviation)
4. The operation (usually "convert")

Available units: ${JSON.stringify(availableUnits.slice(0, 100))} ... (and more)

Equation: "${equation}"

Respond ONLY with a JSON object in this exact format:
{
  "value": <number>,
  "fromUnit": "<unit symbol>",
  "toUnit": "<unit symbol>",
  "operation": "convert"
}

If you cannot parse the equation, respond with:
{
  "error": "description of why it cannot be parsed"
}`
        }
      ]
    });

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse equation' },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.error) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    // Find the unit IDs
    const fromUnit = units.find(u => 
      u.symbol === parsed.fromUnit || 
      u.abbreviations.includes(parsed.fromUnit)
    );
    const toUnit = units.find(u => 
      u.symbol === parsed.toUnit || 
      u.abbreviations.includes(parsed.toUnit)
    );

    if (!fromUnit || !toUnit) {
      return NextResponse.json(
        { error: 'Could not find matching units in database' },
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

    // Find the unit group and conversion
    const unitGroup = unitGroups.find(ug => ug.id === fromUnit.unitGroupId);
    if (!unitGroup) {
      return NextResponse.json(
        { error: 'Unit group not found' },
        { status: 404 }
      );
    }

    const conversion = unitGroup.conversions.find(
      c => c.fromUnitId === fromUnit.id && c.toUnitId === toUnit.id
    );

    if (!conversion) {
      return NextResponse.json(
        { error: 'No direct conversion found between these units' },
        { status: 404 }
      );
    }

    // Perform conversion
    const numValue = parseFloat(parsed.value);
    if (isNaN(numValue)) {
      return NextResponse.json(
        { error: 'Invalid numeric value' },
        { status: 400 }
      );
    }

    const result = eval(conversion.equation.replace('x', numValue.toString()));

    return NextResponse.json({
      originalEquation: equation,
      parsed: {
        value: numValue,
        fromUnit: parsed.fromUnit,
        toUnit: parsed.toUnit
      },
      result: {
        fromValue: numValue,
        fromUnit: fromUnit.symbol,
        fromUnitName: fromUnit.name,
        toValue: result,
        toUnit: toUnit.symbol,
        toUnitName: toUnit.name,
        equation: conversion.equation,
        description: conversion.description
      }
    });
  } catch (error) {
    console.error('Error in /api/solve:', error);
    return NextResponse.json(
      { error: 'Failed to solve equation: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

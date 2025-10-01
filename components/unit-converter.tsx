'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Unit, UnitGroup } from '@/types/schemas';

export default function UnitConverter() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const [fromUnitId, setFromUnitId] = useState('');
  const [toUnitId, setToUnitId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    // Fetch units on mount
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units?pageSize=10000');
        const data = await response.json();
        setUnits(data.data || []);
        setUnitGroups(data.unitGroups || []);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };
    fetchUnits();
  }, []);

  const handleConvert = async () => {
    if (!value || !fromUnitId || !toUnitId) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parseFloat(value),
          fromUnitId,
          toUnitId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Conversion failed');
        return;
      }

      setResult(data);
    } catch (error) {
      setError('Failed to convert units');
      console.error('Error converting:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter units by selected group
  const filteredUnits = selectedGroupId && selectedGroupId !== '__ALL__'
    ? units.filter(u => u.unitGroupId === selectedGroupId)
    : units;

  // Get available units for "to" selection based on "from" unit group
  const availableToUnits = fromUnitId
    ? units.filter(u => {
        const fromUnit = units.find(unit => unit.id === fromUnitId);
        return fromUnit && u.unitGroupId === fromUnit.unitGroupId;
      })
    : filteredUnits;

  return (
    <div className="space-y-6">
      {/* Unit Group Filter */}
      <div>
        <label className="block text-sm font-medium mb-2">Unit Group (Optional)</label>
        <Select value={selectedGroupId || undefined} onValueChange={(val) => setSelectedGroupId(val || '')}>
          <SelectTrigger>
            <SelectValue placeholder="All unit groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">All unit groups</SelectItem>
            {Array.from(new Map(unitGroups.map(group => [group.id, group])).values()).map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* From Unit */}
        <div>
          <label className="block text-sm font-medium mb-2">From Unit</label>
          <Select value={fromUnitId} onValueChange={setFromUnitId}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {filteredUnits.map(unit => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.symbol === unit.name ? unit.symbol : `${unit.symbol} - ${unit.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* To Unit */}
        <div>
          <label className="block text-sm font-medium mb-2">To Unit</label>
          <Select value={toUnitId} onValueChange={setToUnitId} disabled={!fromUnitId}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {availableToUnits.map(unit => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.symbol === unit.name ? unit.symbol : `${unit.symbol} - ${unit.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Value Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Value</label>
        <Input
          type="number"
          placeholder="Enter value to convert"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      {/* Convert Button */}
      <Button onClick={handleConvert} disabled={loading} className="w-full">
        {loading ? 'Converting...' : 'Convert'}
      </Button>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="p-6 bg-primary/5">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {result.fromValue} {result.fromUnit} = {result.toValue.toFixed(4)} {result.toUnit}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {result.fromUnitName} → {result.toUnitName}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Equation:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">{result.equation}</code>
                </div>
                {result.description && (
                  <div>
                    <span className="font-medium">Description:</span>{' '}
                    <span className="text-muted-foreground">{result.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

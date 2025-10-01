'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EquationSolver() {
  const [equation, setEquation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const handleSolve = async () => {
    if (!equation.trim()) {
      setError('Please enter an equation');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to solve equation');
        return;
      }

      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 5)); // Keep last 5
      setEquation(''); // Clear input
    } catch (error) {
      setError('Failed to solve equation');
      console.error('Error solving equation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSolve();
    }
  };

  const examples = [
    'convert 150 tons to BTU/h',
    'convert 500 CFM to L/s',
    'convert 75 PSI to kPa',
    'convert 212 degrees F to celsius',
    'convert 100 GPM to cubic meters per hour'
  ];

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Type a natural language equation and let AI convert it for you. Examples:
        </p>
        <ul className="text-sm space-y-1">
          {examples.map((ex, i) => (
            <li key={i} className="text-muted-foreground">
              • <button 
                  onClick={() => setEquation(ex)}
                  className="hover:underline hover:text-foreground"
                >
                  {ex}
                </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Enter your equation</label>
        <Input
          placeholder="e.g., convert 150 tons to BTU/h"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

      {/* Solve Button */}
      <Button onClick={handleSolve} disabled={loading || !equation.trim()} className="w-full">
        {loading ? 'Solving...' : 'Solve Equation'}
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
            <div>
              <div className="text-sm text-muted-foreground mb-2">Original Equation</div>
              <div className="font-medium">{result.originalEquation}</div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">AI Parsed</div>
              <div className="text-sm space-y-1">
                <div>Value: <span className="font-medium">{result.parsed.value}</span></div>
                <div>From: <span className="font-medium">{result.parsed.fromUnit}</span></div>
                <div>To: <span className="font-medium">{result.parsed.toUnit}</span></div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {result.result.fromValue} {result.result.fromUnit} = {' '}
                  {result.result.toValue.toFixed(4)} {result.result.toUnit}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {result.result.fromUnitName} → {result.result.toUnitName}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Equation:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">{result.result.equation}</code>
                </div>
                {result.result.description && (
                  <div>
                    <span className="font-medium">Description:</span>{' '}
                    <span className="text-muted-foreground">{result.result.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Recent Conversions</h3>
          <div className="space-y-2">
            {history.map((item, i) => (
              <Card key={i} className="p-3">
                <div className="text-sm">
                  <div className="font-medium mb-1">{item.originalEquation}</div>
                  <div className="text-muted-foreground">
                    Result: {item.result.fromValue} {item.result.fromUnit} = {' '}
                    {item.result.toValue.toFixed(4)} {item.result.toUnit}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

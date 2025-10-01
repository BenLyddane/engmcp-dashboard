'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataExplorer from '@/components/data-explorer';
import UnitConverter from '@/components/unit-converter';
import EquationSolver from '@/components/equation-solver';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">MEP Engineering Dashboard</h1>
        <p className="text-muted-foreground">
          Explore spec types, convert units, and solve engineering equations
        </p>
      </div>

      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="explorer">Data Explorer</TabsTrigger>
          <TabsTrigger value="converter">Unit Converter</TabsTrigger>
          <TabsTrigger value="solver">Equation Solver</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer">
          <Card>
            <CardHeader>
              <CardTitle>Data Explorer</CardTitle>
              <CardDescription>
                Search, sort, and filter spec types, units, and component mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataExplorer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="converter">
          <Card>
            <CardHeader>
              <CardTitle>Unit Conversion Calculator</CardTitle>
              <CardDescription>
                Convert between MEP engineering units using built-in conversion equations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnitConverter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solver">
          <Card>
            <CardHeader>
              <CardTitle>Equation Solver</CardTitle>
              <CardDescription>
                Type natural language equations and get AI-powered conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquationSolver />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

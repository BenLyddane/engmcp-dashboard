'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, ArrowUpDown } from 'lucide-react';
import { SpecType, ComponentType } from '@/types/schemas';
import { cn } from '@/lib/utils';

type SortColumn = 'name' | 'domain' | 'valueType' | 'unit' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function DataExplorer() {
  const [data, setData] = useState<SpecType[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('ALL');
  const [valueType, setValueType] = useState('ALL');
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('ALL');
  const [openComponentSelect, setOpenComponentSelect] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load component types on mount
  useEffect(() => {
    const loadComponentTypes = async () => {
      try {
        // You may need to create this endpoint
        const response = await fetch('/api/components');
        if (response.ok) {
          const result = await response.json();
          setComponentTypes(result.data || []);
        }
      } catch (error) {
        console.error('Error loading component types:', error);
      }
    };
    loadComponentTypes();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(query && { query }),
        ...(domain !== 'ALL' && { domain }),
        ...(valueType !== 'ALL' && { valueType }),
        ...(selectedComponent !== 'ALL' && { componentType: selectedComponent }),
        ...(sortColumn && { sortBy: sortColumn }),
        ...(sortDirection && { sortDirection }),
      });

      const response = await fetch(`/api/specs?${params}`);
      const result = await response.json();
      
      setData(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [page, domain, valueType, selectedComponent, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className={cn(
          "h-4 w-4",
          sortColumn === column ? "opacity-100" : "opacity-30"
        )} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search spec types (live search)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Component Type Filter */}
        <Popover open={openComponentSelect} onOpenChange={setOpenComponentSelect}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openComponentSelect}
              className="w-[220px] justify-between"
            >
              {selectedComponent === 'ALL'
                ? 'All Component Types'
                : componentTypes.find((c) => c.id === selectedComponent)?.name || 'Select component...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0">
            <Command>
              <CommandInput placeholder="Search component types..." />
              <CommandList>
                <CommandEmpty>No component type found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    key="ALL"
                    value="ALL"
                    onSelect={() => {
                      setSelectedComponent('ALL');
                      setOpenComponentSelect(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedComponent === 'ALL' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    All Component Types
                  </CommandItem>
                  {componentTypes.map((component) => (
                    <CommandItem
                      key={component.id}
                      value={component.name}
                      onSelect={() => {
                        setSelectedComponent(component.id);
                        setOpenComponentSelect(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedComponent === component.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {component.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Domains</SelectItem>
            <SelectItem value="HVAC">HVAC</SelectItem>
            <SelectItem value="ELECTRICAL">Electrical</SelectItem>
            <SelectItem value="PLUMBING">Plumbing</SelectItem>
            <SelectItem value="FIRE_PROTECTION">Fire Protection</SelectItem>
          </SelectContent>
        </Select>

        <Select value={valueType} onValueChange={setValueType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Value Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="NUMERIC">Numeric</SelectItem>
            <SelectItem value="SELECT">Select</SelectItem>
            <SelectItem value="MULTI_SELECT">Multi-Select</SelectItem>
            <SelectItem value="RANGE">Range</SelectItem>
            <SelectItem value="BOOLEAN">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {data.length} of {total} results
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="name">Name</SortableHeader>
              <TableHead className="w-32">
                <div className="flex items-center gap-2 cursor-pointer select-none hover:bg-muted/50" onClick={() => handleSort('domain')}>
                  Domain
                  <ArrowUpDown className={cn(
                    "h-4 w-4",
                    sortColumn === 'domain' ? "opacity-100" : "opacity-30"
                  )} />
                </div>
              </TableHead>
              <TableHead className="w-32">
                <div className="flex items-center gap-2 cursor-pointer select-none hover:bg-muted/50" onClick={() => handleSort('valueType')}>
                  Value Type
                  <ArrowUpDown className={cn(
                    "h-4 w-4",
                    sortColumn === 'valueType' ? "opacity-100" : "opacity-30"
                  )} />
                </div>
              </TableHead>
              <TableHead className="w-28">
                <div className="flex items-center gap-2 cursor-pointer select-none hover:bg-muted/50" onClick={() => handleSort('unit')}>
                  Primary Unit
                  <ArrowUpDown className={cn(
                    "h-4 w-4",
                    sortColumn === 'unit' ? "opacity-100" : "opacity-30"
                  )} />
                </div>
              </TableHead>
              <TableHead className="w-40">Alternate Units</TableHead>
              <TableHead className="w-80">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              data.map((spec) => (
                <TableRow key={spec.id}>
                  <TableCell className="font-medium">{spec.primaryName}</TableCell>
                  <TableCell className="w-32">
                    <Badge variant="outline">{spec.domain}</Badge>
                  </TableCell>
                  <TableCell className="w-32">
                    <Badge variant="secondary">{spec.valueType}</Badge>
                  </TableCell>
                  <TableCell className="w-28">
                    <span className="text-sm">
                      {(() => {
                        // Extract primary unit from first example if available
                        if (spec.examples && spec.examples.length > 0) {
                          const firstExample = spec.examples[0] as any;
                          if (typeof firstExample === 'object' && firstExample.unit) {
                            return firstExample.unit;
                          }
                        }
                        return (spec as any).primaryUnit || 'N/A';
                      })()}
                    </span>
                  </TableCell>
                  <TableCell className="w-40">
                    {(() => {
                      // Extract unique units from examples
                      const units = new Set<string>();
                      if (spec.examples && Array.isArray(spec.examples)) {
                        spec.examples.forEach((ex: any) => {
                          if (typeof ex === 'object' && ex.unit) {
                            units.add(ex.unit);
                          }
                        });
                      }
                      if ((spec as any).alternateUnits && Array.isArray((spec as any).alternateUnits)) {
                        ((spec as any).alternateUnits as string[]).forEach((u: string) => units.add(u));
                      }
                      
                      // Remove the primary unit from alternates
                      const firstExample = spec.examples?.[0] as any;
                      const primaryUnit = (typeof firstExample === 'object' && firstExample?.unit) || (spec as any).primaryUnit;
                      if (primaryUnit) units.delete(primaryUnit);
                      
                      const alternateUnitsArray = Array.from(units);
                      
                      return alternateUnitsArray.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {alternateUnitsArray.map((unit, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {unit}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="w-80">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="text-sm cursor-help line-clamp-2 hover:underline">
                          {spec.description}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-96" side="left">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{spec.primaryName}</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{spec.description}</p>
                          {spec.examples && spec.examples.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium mb-2">Examples:</p>
                              <div className="space-y-2">
                                {spec.examples.slice(0, 3).map((example: any, idx: number) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium">
                                      {typeof example === 'object' ? `${example.value} ${example.unit}` : example}
                                    </span>
                                    {typeof example === 'object' && example.context && (
                                      <p className="text-muted-foreground mt-0.5">{example.context}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

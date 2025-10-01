'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SpecType } from '@/types/schemas';

export default function DataExplorer() {
  const [data, setData] = useState<SpecType[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('ALL');
  const [valueType, setValueType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(query && { query }),
        ...(domain !== 'ALL' && { domain }),
        ...(valueType !== 'ALL' && { valueType }),
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

  useEffect(() => {
    fetchData();
  }, [page, domain, valueType]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search spec types..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        
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

        <Button onClick={handleSearch}>Search</Button>
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
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Value Type</TableHead>
              <TableHead>Primary Unit</TableHead>
              <TableHead>Alternate Units</TableHead>
              <TableHead className="w-48">Description</TableHead>
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
                  <TableCell>
                    <Badge variant="outline">{spec.domain}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{spec.valueType}</Badge>
                  </TableCell>
                  <TableCell>
                    {spec.primaryUnit || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {spec.alternateUnits && spec.alternateUnits.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {spec.alternateUnits.map((unit, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {unit}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell className="w-48">
                    <div className="truncate text-sm" title={spec.description}>
                      {spec.description}
                    </div>
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

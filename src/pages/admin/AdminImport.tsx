import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CSVRow {
  Handle: string;
  Title: string;
  'Body (HTML)': string;
  'Product Category': string;
  Type: string;
  'Option1 Value': string;
  'Variant SKU': string;
  'Variant Price': string;
  'Variant Compare At Price': string;
  'Variant Inventory Qty': string;
  'Image Src': string;
  Status: string;
  [key: string]: string;
}

interface ProductPreview {
  handle: string;
  title: string;
  category: string;
  variantCount: number;
  imageCount: number;
  totalStock: number;
  price: string;
  status: string;
}

const AdminImport = () => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    productsCreated: number;
    variantsCreated: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCSVLine(lines[0]);
    
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      const row: CSVRow = {} as CSVRow;
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      if (row.Handle) {
        rows.push(row);
      }
    }
    
    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  };

  const processProducts = (rows: CSVRow[]): ProductPreview[] => {
    const productMap = new Map<string, ProductPreview>();

    for (const row of rows) {
      const handle = row.Handle?.trim();
      if (!handle) continue;

      const existing = productMap.get(handle);
      const variantQty = parseInt(row['Variant Inventory Qty']) || 0;

      if (existing) {
        existing.variantCount++;
        existing.totalStock += variantQty;
        if (row['Image Src']?.trim()) {
          existing.imageCount++;
        }
      } else {
        const categoryType = row['Product Category'] || row.Type || '';
        let category = 'Unknown';
        
        if (categoryType.toLowerCase().includes('sweat')) {
          category = 'Sweatshirts';
        } else if (categoryType.toLowerCase().includes('oversized') || row.Title?.toLowerCase().includes('oversized')) {
          category = 'Oversized T-shirts';
        } else if (categoryType.toLowerCase().includes('t-shirt') || categoryType.toLowerCase().includes('tee')) {
          category = 'Simple T-shirts';
        }

        productMap.set(handle, {
          handle,
          title: row.Title?.trim() || handle,
          category,
          variantCount: 1,
          imageCount: row['Image Src']?.trim() ? 1 : 0,
          totalStock: variantQty,
          price: row['Variant Price'] || '0',
          status: row.Status || 'active'
        });
      }
    }

    return Array.from(productMap.values());
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        setCsvData(rows);
        
        const processedProducts = processProducts(rows);
        setProducts(processedProducts);
        
        toast({
          title: 'CSV Parsed',
          description: `Found ${processedProducts.length} unique products from ${rows.length} rows`,
        });
      } catch (error) {
        toast({
          title: 'Parse Error',
          description: 'Failed to parse CSV file. Please check the format.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      const input = document.getElementById('csv-upload') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleImport = async () => {
    if (csvData.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // First, fetch category IDs
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug');

      const categoryMapping: Record<string, string> = {};
      categories?.forEach(cat => {
        categoryMapping[cat.slug] = cat.id;
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('import-shopify-products', {
        body: { rows: csvData, categoryMapping }
      });

      if (error) throw error;

      setImportResult(data);
      
      if (data.errors?.length > 0) {
        toast({
          title: 'Import Completed with Errors',
          description: `Created ${data.productsCreated} products. ${data.errors.length} errors occurred.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `Created ${data.productsCreated} products and ${data.variantsCreated} variants`,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Import Products</h1>
            <p className="text-muted-foreground">Import products from Shopify CSV export</p>
          </div>
          {importResult && importResult.productsCreated > 0 && (
            <Button onClick={() => navigate('/admin/products')}>
              View Products
            </Button>
          )}
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload your Shopify products export CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
            >
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-lg font-medium">
                      {isLoading ? 'Processing...' : 'Drop your CSV file here or click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports Shopify product export format
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Preview Table */}
        {products.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preview ({products.length} products)
                </CardTitle>
                <CardDescription>
                  Review products before importing
                </CardDescription>
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isImporting}
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import All Products</>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Variants</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.handle}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.title}</p>
                            <p className="text-xs text-muted-foreground">{product.handle}</p>
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.variantCount}</TableCell>
                        <TableCell>{product.imageCount}</TableCell>
                        <TableCell>{product.totalStock}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Result */}
        {importResult && (
          <Card className={importResult.errors.length > 0 ? 'border-destructive' : 'border-green-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.errors.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-bold">{importResult.productsCreated}</p>
                  <p className="text-sm text-muted-foreground">Products Created</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{importResult.variantsCreated}</p>
                  <p className="text-sm text-muted-foreground">Variants Created</p>
                </div>
              </div>
              
              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-destructive mb-2">Errors ({importResult.errors.length}):</p>
                  <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminImport;

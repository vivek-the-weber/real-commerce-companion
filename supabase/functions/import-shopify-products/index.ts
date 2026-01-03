import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
}

interface ProductData {
  slug: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  category_id: string | null;
  is_active: boolean;
  variants: {
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    options: { color: string };
    image_url: string | null;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rows, categoryMapping } = await req.json() as { 
      rows: CSVRow[]; 
      categoryMapping: Record<string, string>;
    };

    console.log(`Processing ${rows.length} CSV rows`);

    // Group rows by Handle (product slug)
    const productMap = new Map<string, ProductData>();

    for (const row of rows) {
      const handle = row.Handle?.trim();
      if (!handle) continue;

      const existingProduct = productMap.get(handle);
      const variantPrice = parseFloat(row['Variant Price']) || 0;
      const compareAtPrice = parseFloat(row['Variant Compare At Price']) || null;
      const variantQty = parseInt(row['Variant Inventory Qty']) || 0;
      const imageSrc = row['Image Src']?.trim();
      const colorOption = row['Option1 Value']?.trim();

      if (existingProduct) {
        // Add image if not already present
        if (imageSrc && !existingProduct.images.includes(imageSrc)) {
          existingProduct.images.push(imageSrc);
        }
        
        // Add stock
        existingProduct.stock_quantity += variantQty;

        // Add variant if it's a new color
        if (colorOption) {
          const existingVariant = existingProduct.variants.find(v => v.name === colorOption);
          if (existingVariant) {
            existingVariant.stock_quantity += variantQty;
            // Update image if this row has one and variant doesn't
            if (imageSrc && !existingVariant.image_url) {
              existingVariant.image_url = imageSrc;
            }
          } else {
            existingProduct.variants.push({
              name: colorOption,
              sku: row['Variant SKU'] || '',
              price: variantPrice,
              stock_quantity: variantQty,
              options: { color: colorOption },
              image_url: imageSrc || null
            });
          }
        }
      } else {
        // Determine category from Product Category or Type
        const categoryType = row['Product Category']?.toLowerCase() || row.Type?.toLowerCase() || '';
        let categoryId: string | null = null;
        
        if (categoryType.includes('sweat')) {
          categoryId = categoryMapping['sweatshirts'] || null;
        } else if (categoryType.includes('oversized') || row.Title?.toLowerCase().includes('oversized')) {
          categoryId = categoryMapping['oversized-tees'] || null;
        } else if (categoryType.includes('t-shirt') || categoryType.includes('tee')) {
          categoryId = categoryMapping['simple-tees'] || null;
        }

        const newProduct: ProductData = {
          slug: handle,
          name: row.Title?.trim() || handle,
          description: row['Body (HTML)']?.trim() || '',
          price: variantPrice,
          compare_at_price: compareAtPrice,
          images: imageSrc ? [imageSrc] : [],
          stock_quantity: variantQty,
          category_id: categoryId,
          is_active: row.Status?.toLowerCase() === 'active',
          variants: colorOption ? [{
            name: colorOption,
            sku: row['Variant SKU'] || '',
            price: variantPrice,
            stock_quantity: variantQty,
            options: { color: colorOption },
            image_url: imageSrc || null
          }] : []
        };

        productMap.set(handle, newProduct);
      }
    }

    console.log(`Grouped into ${productMap.size} unique products`);

    const results = {
      productsCreated: 0,
      variantsCreated: 0,
      errors: [] as string[]
    };

    // Insert products and variants
    for (const [slug, productData] of productMap) {
      try {
        // Insert product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            slug: productData.slug,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            compare_at_price: productData.compare_at_price,
            images: productData.images,
            stock_quantity: productData.stock_quantity,
            category_id: productData.category_id,
            is_active: productData.is_active,
            is_featured: false
          })
          .select()
          .single();

        if (productError) {
          console.error(`Error inserting product ${slug}:`, productError);
          results.errors.push(`Product ${slug}: ${productError.message}`);
          continue;
        }

        results.productsCreated++;
        console.log(`Created product: ${productData.name} (${product.id})`);

        // Insert variants
        if (productData.variants.length > 0) {
          const variantsToInsert = productData.variants.map(v => ({
            product_id: product.id,
            name: v.name,
            sku: v.sku || null,
            price: v.price,
            stock_quantity: v.stock_quantity,
            options: v.options,
            image_url: v.image_url
          }));

          const { error: variantsError, data: insertedVariants } = await supabase
            .from('product_variants')
            .insert(variantsToInsert)
            .select();

          if (variantsError) {
            console.error(`Error inserting variants for ${slug}:`, variantsError);
            results.errors.push(`Variants for ${slug}: ${variantsError.message}`);
          } else {
            results.variantsCreated += insertedVariants?.length || 0;
          }
        }
      } catch (err) {
        console.error(`Unexpected error for product ${slug}:`, err);
        results.errors.push(`${slug}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Import complete: ${results.productsCreated} products, ${results.variantsCreated} variants`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in import-shopify-products:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

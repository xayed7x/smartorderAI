// app/products/page.tsx

import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RocketIcon } from 'lucide-react';

// A more robust type definition for our products
export type Product = {
  id: string;
  created_at: string;
  product_name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
};

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load products. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pt-16">

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as Product} />
          ))}
        </div>
      ) : (
        <Alert>
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>No Products Found</AlertTitle>
          <AlertDescription>
            We are currently updating our catalog. Please check back later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
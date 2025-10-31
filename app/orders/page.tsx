// File: app/orders/page.tsx

import { supabase } from '@/lib/supabase';
import OrderCard from '@/components/order-card'; // Corrected to default import
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RocketIcon } from 'lucide-react';

// A more robust type definition for our orders
export type OrderWithProduct = {
  id: string;
  created_at: string;
  status: string;
  customer_details: { [key: string]: any } | null; // Flexible for dynamic JSON
  products: {
    product_name: string;
    image_url: string;
    price: number;
    product_code: string;
  } | null;
};

export default async function OrdersPage() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, products(*)') // Select all columns from products
    .order('created_at', { ascending: false }); // Show newest orders first

  if (error) {
    console.error('Error fetching orders:', error);
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load orders. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pt-16">

      {orders && orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order as OrderWithProduct} />
          ))}
        </div>
      ) : (
        <Alert>
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>No Incoming Orders Yet</AlertTitle>
          <AlertDescription>
            New orders placed by customers or the AI will appear here automatically.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
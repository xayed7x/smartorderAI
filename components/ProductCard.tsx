// components/ProductCard.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Product = {
  // Define the product type to match your Supabase table
  product_name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader>
        <img src={product.image_url} alt={product.product_name} className="rounded-md w-full object-cover aspect-square"/>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-2">{product.product_name}</CardTitle>
        <p className="font-semibold">BDT {product.price}</p>
        <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of Stock"}
        </Badge>
      </CardContent>
    </Card>
  );
}
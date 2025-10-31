// File: components/order-card.tsx

"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderWithProduct } from '@/app/orders/page'; // Import the type from the page
import { supabase } from '@/lib/supabase'; // Import supabase client
import { toast } from 'sonner'; // Assuming you use sonner for notifications

interface OrderCardProps {
  order: OrderWithProduct;
}

export default function OrderCard({ order: initialOrder }: OrderCardProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    const { data, error } = await supabase
      .from('orders')
      .update({ status: selectedStatus })
      .eq('id', order.id)
      .select()
      .single();

    if (error) {
      toast.error("Failed to update status.");
      console.error(error);
    } else {
      toast.success("Order status updated successfully!");
      setOrder(data as OrderWithProduct);
    }
    setIsUpdating(false);
  };
  
  const customerDetails = order.customer_details ? Object.entries(order.customer_details) : [];

  return (
    <Dialog>
      <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={order.products?.image_url} alt={order.products?.product_name} />
            <AvatarFallback>{order.products?.product_name?.charAt(0) ?? 'P'}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle>{order.products?.product_name ?? "Unknown Product"}</CardTitle>
            <CardDescription>Order ID: {order.id.substring(0, 8)}...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="text-sm text-muted-foreground">
            <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
          </div>
           <div className="text-sm text-muted-foreground">
            <strong>Price:</strong> BDT {order.products?.price ?? 'N/A'}
          </div>
          <div className="mt-2">
            <Badge variant={getStatusVariant(order.status)} className="capitalize text-sm">
              {order.status}
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full">View & Manage</Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Product: {order.products?.product_name} (Code: {order.products?.product_code})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h4 className="font-semibold">Customer Information</h4>
          {customerDetails.length > 0 ? (
            customerDetails.map(([key, value]) => (
              <div key={key} className="text-sm">
                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {String(value)}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No customer details collected.</p>
          )}
          <hr className="my-2"/>
          <h4 className="font-semibold">Manage Status</h4>
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStatusUpdate} disabled={isUpdating || selectedStatus === order.status}>
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
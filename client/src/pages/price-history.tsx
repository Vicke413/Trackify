import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceHistoryChart } from "@/components/dashboard/PriceHistoryChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Product, PriceHistory } from "@shared/schema";

export default function PriceHistoryPage() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch price history for selected product
  const { data: priceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/products', selectedProductId, 'history'],
    enabled: !!selectedProductId,
  });

  // Set default selected product when products load
  useEffect(() => {
    if (products?.length && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Get the selected product details
  const selectedProduct = products?.find(p => p.id === selectedProductId);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Price History</h1>
          <p className="text-muted-foreground">
            View detailed price history for your tracked products
          </p>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Select Product</CardTitle>
              <CardDescription>
                Choose a product to view its price history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : products?.length ? (
                <Select 
                  value={selectedProductId?.toString()} 
                  onValueChange={val => setSelectedProductId(parseInt(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No products found. Add products to track their price history.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedProductId && (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{selectedProduct?.name || "Product Details"}</CardTitle>
                <CardDescription>
                  {selectedProduct ? (
                    `Tracking since ${formatDate(selectedProduct.createdAt)}`
                  ) : "Loading product details..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading || !priceHistory ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : priceHistory.length > 0 ? (
                  <>
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCurrency(Number(selectedProduct?.currentPrice), selectedProduct?.currency)}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              Math.max(...priceHistory.map((p: PriceHistory) => Number(p.price))), 
                              selectedProduct?.currency
                            )}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              Math.min(...priceHistory.map((p: PriceHistory) => Number(p.price))), 
                              selectedProduct?.currency
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="h-[300px]">
                      <PriceHistoryChart 
                        data={priceHistory} 
                        currency={selectedProduct?.currency || "USD"} 
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Price Change History</h3>
                      <div className="border rounded-md">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">Price</th>
                              </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                              {[...priceHistory].reverse().map((entry: PriceHistory) => (
                                <tr key={entry.id}>
                                  <td className="px-4 py-3 text-sm text-left whitespace-nowrap">
                                    {formatDate(entry.timestamp)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium">
                                    {formatCurrency(Number(entry.price), selectedProduct?.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No price history available for this product yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">Price history will be recorded when the product price changes.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
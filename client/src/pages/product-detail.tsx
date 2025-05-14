import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceHistoryChart } from "@/components/dashboard/PriceHistoryChart";
import { PriceAlertForm } from "@/components/products/PriceAlertForm";
import { 
  formatCurrency, 
  calculatePriceDifference, 
  formatPercentage, 
  formatDateTime,
  getPriceChangeColor,
  extractDomain,
} from "@/lib/utils";
import { 
  RefreshCw, 
  ExternalLink, 
  Bell, 
  Trash2, 
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Minus,
  Loader2,
  ShoppingCart
} from "lucide-react";
import { Product, PriceHistory, PriceAlert } from "@shared/schema";

interface ProductDetailProps {
  id: number;
}

export default function ProductDetail({ id }: ProductDetailProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct, isError: isProductError } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });

  // Fetch price history
  const { data: priceHistory, isLoading: isLoadingHistory } = useQuery<PriceHistory[]>({
    queryKey: [`/api/products/${id}/history`],
    enabled: !!product,
  });

  // Fetch price alerts
  const { data: priceAlerts, isLoading: isLoadingAlerts } = useQuery<PriceAlert[]>({
    queryKey: [`/api/products/${id}/alerts`],
    enabled: !!product,
  });

  // Calculate price difference
  const previousPrice = priceHistory && priceHistory.length > 1 
    ? Number(priceHistory[priceHistory.length - 2].price) 
    : null;
  
  const priceDifference = previousPrice 
    ? calculatePriceDifference(Number(product?.currentPrice), previousPrice) 
    : 0;

  // Determine price trend icon
  const PriceTrendIcon = () => {
    if (priceDifference < 0) return <TrendingDown className="h-5 w-5" />;
    if (priceDifference > 0) return <TrendingUp className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  // Refresh price mutation
  const refreshPriceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/products/${id}/refresh`, undefined);
      return response.json();
    },
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}/history`] });
      toast({
        title: "Price refreshed",
        description: "Product price has been updated with the latest data",
      });
    },
    onError: (error) => {
      toast({
        title: "Error refreshing price",
        description: error instanceof Error ? error.message : "Failed to refresh price",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/products/${id}`, undefined);
    },
    onMutate: () => {
      setIsDeleting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      navigate("/");
      toast({
        title: "Product deleted",
        description: "Product has been removed from your tracking list",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting product",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  // Handle refresh button click
  const handleRefresh = () => {
    refreshPriceMutation.mutate();
  };

  // Handle delete button click
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate();
    }
  };

  // Show loading state
  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading product details...</span>
      </div>
    );
  }

  // Show error state
  if (isProductError || !product) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-destructive mb-4">Error loading product details</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full object-contain h-64"
                />
              ) : (
                <div className="h-64 w-full flex items-center justify-center bg-muted">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <Badge variant="outline" className="mr-2">
                  {extractDomain(product.url)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last updated: {formatDateTime(product.lastChecked)}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold mr-2">
                    {formatCurrency(Number(product.currentPrice), product.currency)}
                  </span>
                  {previousPrice !== null && (
                    <div className={`flex items-center ${getPriceChangeColor(priceDifference)}`}>
                      <PriceTrendIcon />
                      <span className="ml-1">{formatPercentage(priceDifference)}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button onClick={handleRefresh} disabled={isRefreshing}>
                    {isRefreshing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh Price
                  </Button>
                  <Button variant="outline" asChild>
                    <a 
                      href={product.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Store
                    </a>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="price-history">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="price-history">Price History</TabsTrigger>
                  <TabsTrigger value="price-alerts">Price Alerts</TabsTrigger>
                </TabsList>
                <TabsContent value="price-history" className="pt-4">
                  {isLoadingHistory ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading price history...</span>
                    </div>
                  ) : (
                    <PriceHistoryChart 
                      data={priceHistory || []} 
                      currency={product.currency} 
                    />
                  )}
                </TabsContent>
                <TabsContent value="price-alerts" className="pt-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Set a Price Alert</h3>
                    <PriceAlertForm 
                      productId={product.id} 
                      currentPrice={Number(product.currentPrice)} 
                      currency={product.currency}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/products/${id}/alerts`] })}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Your Price Alerts</h3>
                    {isLoadingAlerts ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Loading alerts...</span>
                      </div>
                    ) : priceAlerts && priceAlerts.length > 0 ? (
                      <div className="space-y-3">
                        {priceAlerts.map((alert) => (
                          <Card key={alert.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <Bell className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <p className="font-medium">
                                    {formatCurrency(Number(alert.targetPrice), product.currency)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {alert.active ? "Active" : "Inactive"}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await apiRequest("DELETE", `/api/alerts/${alert.id}`, undefined);
                                    queryClient.invalidateQueries({ queryKey: [`/api/products/${id}/alerts`] });
                                    toast({
                                      title: "Alert deleted",
                                      description: "Price alert has been removed",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error deleting alert",
                                      description: "Failed to delete the price alert",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border rounded-md">
                        <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="mb-2 text-muted-foreground">You don't have any price alerts set up</p>
                        <p className="text-sm text-muted-foreground">
                          Set a target price above to get notified when the price drops
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Price Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price</span>
                  <span className="font-medium">
                    {formatCurrency(Number(product.currentPrice), product.currency)}
                  </span>
                </div>
                
                {previousPrice !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Price</span>
                    <span className="font-medium">
                      {formatCurrency(previousPrice, product.currency)}
                    </span>
                  </div>
                )}
                
                {previousPrice !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span className={getPriceChangeColor(priceDifference)}>
                      {formatPercentage(priceDifference)}
                    </span>
                  </div>
                )}
                
                {priceHistory && priceHistory.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Highest Price</span>
                      <span className="font-medium">
                        {formatCurrency(
                          Math.max(...priceHistory.map(h => Number(h.price))), 
                          product.currency
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lowest Price</span>
                      <span className="font-medium">
                        {formatCurrency(
                          Math.min(...priceHistory.map(h => Number(h.price))), 
                          product.currency
                        )}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking Since</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="border-t my-4 pt-4">
                <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    asChild
                  >
                    <a 
                      href={product.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy Now
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Product Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Store</p>
                  <p className="font-medium">{extractDomain(product.url)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">URL</p>
                  <p className="font-medium break-words text-sm">
                    <a 
                      href={product.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {product.url.length > 50 
                        ? `${product.url.substring(0, 50)}...` 
                        : product.url}
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

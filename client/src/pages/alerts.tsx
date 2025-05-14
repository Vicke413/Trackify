import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { PriceAlert, Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AlertsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all user alerts
  const { data: allAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
  });

  // Fetch products to get their details
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Toggle alert status mutation
  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return await apiRequest(`/api/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert updated",
        description: "Your price alert has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update price alert status.",
        variant: "destructive",
      });
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/alerts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert deleted",
        description: "Your price alert has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete price alert.",
        variant: "destructive",
      });
    },
  });

  // Filter alerts based on active status
  const filteredAlerts = allAlerts?.filter((alert: PriceAlert) => {
    if (activeTab === "active") return alert.active;
    if (activeTab === "inactive") return !alert.active;
    return true; // all
  });

  // Get product details by ID
  const getProduct = (productId: number) => {
    return products?.find((p: Product) => p.id === productId);
  };

  const isLoading = alertsLoading || productsLoading;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Price Alerts</h1>
          <p className="text-muted-foreground">
            Manage your price drop alerts and get notified when prices fall
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Price Alerts</CardTitle>
            <CardDescription>
              Get notified when a product's price drops below your target price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
              
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredAlerts?.length > 0 ? (
                <div className="space-y-4">
                  {filteredAlerts.map((alert: PriceAlert) => {
                    const product = getProduct(alert.productId);
                    return (
                      <div 
                        key={alert.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card"
                      >
                        <div className="mb-4 sm:mb-0">
                          <h3 className="font-medium">{product?.name || "Product"}</h3>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                            <span>Current: {formatCurrency(Number(product?.currentPrice), product?.currency)}</span>
                            <span>Target: {formatCurrency(Number(alert.targetPrice), product?.currency)}</span>
                            <span>Created: {formatDate(alert.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            {alert.active ? <Bell size={14} /> : <BellOff size={14} className="text-muted-foreground" />}
                            <Switch 
                              checked={alert.active} 
                              onCheckedChange={(checked) => {
                                toggleAlertMutation.mutate({ id: alert.id, active: checked });
                              }}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this alert?")) {
                                deleteAlertMutation.mutate(alert.id);
                              }
                            }}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No alerts found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTab === "all" 
                      ? "You haven't set up any price alerts yet. Set alerts from the product details page."
                      : activeTab === "active" 
                        ? "You don't have any active price alerts."
                        : "You don't have any inactive price alerts."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = "/"}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
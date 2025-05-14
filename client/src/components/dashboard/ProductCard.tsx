import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  formatCurrency, 
  calculatePriceDifference, 
  formatPercentage, 
  extractDomain, 
  getTimeElapsed,
  getPriceChangeColor,
  getPriceChangeIcon,
} from "@/lib/utils";
import { 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  TrendingDown, 
  TrendingUp,
  Minus,
  Loader2
} from "lucide-react";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  previousPrice?: number;
}

export function ProductCard({ product, previousPrice }: ProductCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const priceDifference = previousPrice 
    ? calculatePriceDifference(Number(product.currentPrice), previousPrice) 
    : 0;
  
  const priceChangeIcon = getPriceChangeIcon(priceDifference);
  const priceChangeColor = getPriceChangeColor(priceDifference);

  const refreshPriceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/products/${id}/refresh`, undefined);
      return response.json();
    },
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`, undefined);
    },
    onMutate: () => {
      setIsDeleting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    refreshPriceMutation.mutate(product.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const PriceChangeIcon = () => {
    if (priceChangeIcon === "trending-down") return <TrendingDown className="h-4 w-4" />;
    if (priceChangeIcon === "trending-up") return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <Link href={`/product/${product.id}`}>
          <a className="block">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-48 w-full object-cover object-center"
                />
              ) : (
                <div className="h-48 w-full flex items-center justify-center bg-gray-100">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium line-clamp-2 h-10">
                {product.name}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {formatCurrency(Number(product.currentPrice), product.currency)}
                  </p>
                  {previousPrice && (
                    <p className={`text-xs flex items-center ${priceChangeColor}`}>
                      <PriceChangeIcon />
                      <span className="ml-1">
                        {formatPercentage(priceDifference)}
                      </span>
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {extractDomain(product.url)}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Last checked: {getTimeElapsed(product.lastChecked)}
              </p>
            </div>
          </a>
        </Link>
      </CardContent>
      <CardFooter className="p-3 pt-0 gap-2 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          asChild
        >
          <a 
            href={product.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-8 p-0 flex-none"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;

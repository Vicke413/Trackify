import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Product } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => 
        product.name.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "price-low":
        filtered.sort((a, b) => Number(a.currentPrice) - Number(b.currentPrice));
        break;
      case "price-high":
        filtered.sort((a, b) => Number(b.currentPrice) - Number(a.currentPrice));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "latest":
      default:
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    
    return filtered;
  }, [products, searchQuery, sortOption]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        totalProducts: 0,
        totalValue: 0,
        avgPrice: 0,
        potentialSavings: 0
      };
    }
    
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, product) => sum + Number(product.currentPrice), 
      0
    );
    const avgPrice = totalValue / totalProducts;
    
    // Estimate potential savings (10% of total value)
    const potentialSavings = totalValue * 0.1;
    
    return { totalProducts, totalValue, avgPrice, potentialSavings };
  }, [products]);

  return (
    <div>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Dashboard</h1>
          <p className="text-muted-foreground">
            Track and monitor prices for your favorite products
          </p>
        </div>
        <Button asChild>
          <Link href="/add-product">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon="products" 
        />
        <StatCard 
          title="Total Value" 
          value={`$${stats.totalValue.toFixed(2)}`} 
          icon="savings" 
        />
        <StatCard 
          title="Average Price" 
          value={`$${stats.avgPrice.toFixed(2)}`} 
          icon="alerts" 
        />
        <StatCard 
          title="Potential Savings" 
          value={`$${stats.potentialSavings.toFixed(2)}`} 
          subtitle="Based on price alerts" 
          icon="drops" 
        />
      </div>

      <Tabs defaultValue="grid" className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="grid" className="m-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64 text-destructive">
              Error loading products. Please try again.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64">
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No products match your search"
                  : "You haven't added any products yet"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/add-product">Add Your First Product</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="m-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64 text-destructive">
              Error loading products. Please try again.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64">
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No products match your search"
                  : "You haven't added any products yet"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/add-product">Add Your First Product</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Last Updated</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Link href={`/product/${product.id}`}>
                            <a className="flex items-center">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="w-10 h-10 object-cover rounded-md mr-3"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new URL(product.url).hostname.replace('www.', '')}
                                </div>
                              </div>
                            </a>
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(Number(product.currentPrice))}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(product.lastChecked).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/product/${product.id}`}>View</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={product.url} target="_blank" rel="noopener noreferrer">Shop</a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

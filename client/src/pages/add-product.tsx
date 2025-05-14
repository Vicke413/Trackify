import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import AddProductForm from "@/components/products/AddProductForm";

export default function AddProduct() {
  const [, navigate] = useLocation();

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add a New Product</CardTitle>
              <CardDescription>
                Enter the URL of an e-commerce product to start tracking its price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddProductForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-medium">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Enter Product URL</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste the link to any product from your favorite e-commerce site
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-medium">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Track Price History</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll automatically check and record price changes over time
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-medium">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Set Price Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Create price drop alerts to be notified when prices fall below your target
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-medium">4</span>
                </div>
                <div>
                  <h3 className="font-medium">Save Money</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchase at the ideal time to maximize your savings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Trackify works with most major e-commerce websites including:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-md p-2 text-center text-sm">Amazon</div>
                <div className="border rounded-md p-2 text-center text-sm">eBay</div>
                <div className="border rounded-md p-2 text-center text-sm">Walmart</div>
                <div className="border rounded-md p-2 text-center text-sm">Best Buy</div>
                <div className="border rounded-md p-2 text-center text-sm">Target</div>
                <div className="border rounded-md p-2 text-center text-sm">Etsy</div>
                <div className="border rounded-md p-2 text-center text-sm">Newegg</div>
                <div className="border rounded-md p-2 text-center text-sm">And more...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

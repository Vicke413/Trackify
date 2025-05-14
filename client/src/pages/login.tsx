import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import { DollarSign } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center justify-center mb-8">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <h1 className="ml-3 text-3xl font-bold logo-gradient">PriceTracker</h1>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to track prices and receive alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register">
              <a className="text-primary hover:underline">Register</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

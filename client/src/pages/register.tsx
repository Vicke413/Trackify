import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterForm from "@/components/auth/RegisterForm";
import logoPath from "../assets/logo.jpeg";

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center justify-center mb-8">
        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
          <img src={logoPath} alt="Trackify Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="ml-3 text-3xl font-bold logo-gradient">Trackify</h1>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Start tracking product prices and get notified when they drop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <a className="text-primary hover:underline">Sign in</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

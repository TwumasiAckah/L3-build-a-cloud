import { Card, CardContent } from "../components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 shadow-xl border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              404 Page Not Found
            </h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>

          <div className="mt-8 flex justify-end">
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="checkered text-foreground/80 w-24 h-12 mb-8" aria-hidden />
      <h1 className="display text-8xl md:text-9xl text-primary">DNF</h1>
      <p className="mt-4 text-lg text-muted-foreground">This page went off track. It doesn't exist.</p>
      <Button asChild className="mt-8">
        <Link to="/">Back to the pits</Link>
      </Button>
    </div>
  );
};

export default NotFound;


import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { refreshSession } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Attempt to refresh the session to prevent authentication issues
    // when landing on a 404 page
    refreshSession().catch(error => {
      console.error("Failed to refresh session on 404 page:", error);
    });
  }, [location.pathname, refreshSession]);

  const isProductPage = location.pathname.startsWith('/product/');
  const title = isProductPage ? "Product Not Found" : "Page Not Found";
  const description = isProductPage 
    ? "The product you're looking for doesn't exist or has been removed."
    : "Sorry, the page you're looking for doesn't exist.";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 text-center">{description}</p>
        
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;

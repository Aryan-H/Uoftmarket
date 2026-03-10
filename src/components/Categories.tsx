
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Book, Laptop, Home, Bike, GraduationCap, Tag, Sofa } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const categories = [
  {
    id: 1,
    name: 'Textbooks',
    icon: Book,
    description: 'Find textbooks for all courses at UofT',
    color: 'bg-blue-50',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-200',
    link: '/products?category=textbooks'
  },
  {
    id: 2,
    name: 'Electronics',
    icon: Laptop,
    description: 'Laptops, calculators, tablets and more',
    color: 'bg-purple-50',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-200',
    link: '/products?category=electronics'
  },
  {
    id: 3,
    name: 'Housing',
    icon: Home,
    description: 'Find roommates and student housing',
    color: 'bg-green-50',
    iconColor: 'text-green-500',
    borderColor: 'border-green-200',
    link: '/products?category=housing'
  },
  {
    id: 4,
    name: 'Furniture',
    icon: Sofa,
    description: 'Desks, chairs, shelves and more',
    color: 'bg-orange-50',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-200',
    link: '/products?category=furniture'
  },
  {
    id: 5,
    name: 'Transportation',
    icon: Bike,
    description: 'Bikes, scooters, rideshares and more',
    color: 'bg-red-50',
    iconColor: 'text-red-500',
    borderColor: 'border-red-200',
    link: '/products?category=transportation'
  },
  {
    id: 6,
    name: 'Academic Services',
    icon: GraduationCap,
    description: 'Tutoring, editing, and study groups',
    color: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    borderColor: 'border-yellow-200',
    link: '/products?category=academic-services'
  },
  {
    id: 7,
    name: 'Miscellaneous',
    icon: Tag,
    description: 'Everything else for student life',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-200',
    link: '/products?category=miscellaneous'
  }
];

const Categories = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const maxScroll = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      threshold: 0.1
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      maxScroll.current = containerRef.current.scrollWidth - containerRef.current.clientWidth;
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const newPosition = direction === 'left' 
        ? Math.max(scrollPosition - 300, 0) 
        : Math.min(scrollPosition + 300, maxScroll.current);
        
      containerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      setScrollPosition(newPosition);
    }
  };

  const handleCategoryClick = (e: React.MouseEvent, categoryLink: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Authentication required", {
        description: "Please sign in to browse products"
      });
      navigate('/auth');
    }
  };

  return (
    <section className="py-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-toronto-dark mb-4">Browse by Category</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find exactly what you need, organized by category
          </p>
        </div>
        
        <div className="relative">
          {scrollPosition > 0 && (
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-200 rounded-full h-10 w-10 -ml-5"
              onClick={() => scroll('left')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div 
            ref={containerRef}
            className={`flex space-x-6 pb-4 overflow-x-auto hide-scrollbar transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link 
                  key={category.id}
                  to={category.link}
                  className={`flex-shrink-0 w-64 p-6 rounded-xl border ${category.borderColor} ${category.color} transition-all duration-300 hover:shadow-md hover:-translate-y-1 group`}
                  onClick={(e) => handleCategoryClick(e, category.link)}
                >
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center ${category.iconColor} bg-white border ${category.borderColor} mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </Link>
              );
            })}
          </div>
          
          {scrollPosition < maxScroll.current && (
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-200 rounded-full h-10 w-10 -mr-5"
              onClick={() => scroll('right')}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;

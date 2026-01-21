import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import partsImage from "@/assets/parts-category.jpg";
import accessoriesImage from "@/assets/accessories-category.jpg";
import heroImage from "@/assets/hero-car.jpg";

const categories = [
  {
    id: "car",
    name: "Vehicles",
    description: "Premium sedans, SUVs, trucks & more",
    image: heroImage,
    count: "15,000+",
    href: "/products?category=car",
  },
  {
    id: "part",
    name: "Auto Parts",
    description: "OEM & aftermarket parts",
    image: partsImage,
    count: "100,000+",
    href: "/products?category=part",
  },
  {
    id: "accessory",
    name: "Accessories",
    description: "Interior, exterior & performance",
    image: accessoriesImage,
    count: "50,000+",
    href: "/products?category=accessory",
  },
];

const CategoriesSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Shop by Category
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore our extensive catalog of vehicles and automotive products
            </p>
          </div>
          <Link to="/products">
            <Button variant="ghost" className="gap-2 text-accent hover:text-accent">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={category.href}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] card-hover animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-3">
                    {category.count} items
                  </span>
                  <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                    {category.name}
                  </h3>
                  <p className="text-primary-foreground/80 text-sm">
                    {category.description}
                  </p>
                </div>
                
                {/* Arrow */}
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center transform transition-all duration-300 group-hover:bg-accent group-hover:scale-110">
                  <ArrowRight className="w-5 h-5 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;

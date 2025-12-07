// src/components/CuisineSection.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "/api/posts";
const BACKEND_URL = "http://localhost:5000";

interface Dish {
  _id: string;
  title: string;
  content: string;
  images: string[];
  price?: number;
  foodType?: string;
  ratingAverage: number;
  ratingCount: number;
}

const CuisineSection = () => {
  const [featuredDishes, setFeaturedDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedDishes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}?category=am_thuc&status=published&limit=6`);
        if (!res.ok) throw new Error("Không thể tải dữ liệu");

        const data: Dish[] = await res.json();

        const validDishes = data
          .filter(dish => dish.images && dish.images.length > 0 && dish.ratingAverage > 0)
          .sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount);

        setFeaturedDishes(validDishes.slice(0, 3));
      } catch (err) {
        console.error("Lỗi tải món ăn nổi bật:", err);
        setFeaturedDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDishes();
  }, []);

  const formatPrice = (price?: number) => {
    if (!price) return "Liên hệ";
    return `${price.toLocaleString()}đ`;
  };

  const getCategoryLabel = (foodType?: string) => {
    const map: Record<string, string> = {
      mon_chinh: 'Món chính',
      mon_nhe: 'Món nhẹ',
      trang_mieng: 'Tráng miệng',
    };
    return foodType ? map[foodType] || 'Đặc sản' : 'Đặc sản';
  };

  const handleViewDetail = (id: string) => {
    navigate(`/cuisine/${id}`);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 sunset-gradient text-white">Ẩm thực Đà Nẵng</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Hương vị <span className="text-secondary">đặc trưng</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá những món ăn ngon nổi tiếng và các địa điểm ẩm thực tuyệt vời
          </p>
        </div>

        {/* Featured Dishes */}
        {featuredDishes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {featuredDishes.map((dish) => (
              <Card key={dish._id} className="group card-hover border-0 shadow-lg overflow-hidden">
                {/* Click ảnh cũng vào chi tiết */}
                <div className="relative overflow-hidden cursor-pointer" onClick={() => handleViewDetail(dish._id)}>
                  <img
                    src={dish.images[0].startsWith('http') ? dish.images[0] : `${BACKEND_URL}${dish.images[0]}`}
                    alt={dish.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="tropical-gradient text-white text-xs">
                      {getCategoryLabel(dish.foodType)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold line-clamp-2">{dish.title}</h3>
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{dish.ratingAverage.toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs">({dish.ratingCount})</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {dish.content.length > 100 ? dish.content.slice(0, 100) + '...' : dish.content}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1 text-primary font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatPrice(dish.price)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dish.ratingCount} đánh giá
                    </span>
                  </div>

                  {/* Nút Xem chi tiết - không có icon */}
                  <Button
                    className="w-full hero-gradient hover:opacity-90 text-white font-medium"
                    onClick={() => handleViewDetail(dish._id)}
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Chưa có món ăn nổi bật nào được đánh giá
          </div>
        )}

        {/* Restaurant Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { name: 'Nhà hàng cao cấp', count: 45, color: 'hero-gradient' },
            { name: 'Quán ăn địa phương', count: 120, color: 'sunset-gradient' },
            { name: 'Ẩm thực đường phố', count: 80, color: 'tropical-gradient' },
            { name: 'Café & Bar', count: 65, color: 'hero-gradient' },
          ].map((category, index) => (
            <Card key={index} className="p-6 text-center card-hover border-0 shadow-md">
              <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-2xl font-bold text-white">{category.count}</span>
              </div>
              <h3 className="font-semibold mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground">địa điểm</p>
            </Card>
          ))}
        </div>

       
      </div>
    </section>
  );
};

export default CuisineSection;
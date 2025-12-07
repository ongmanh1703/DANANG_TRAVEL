// src/pages/Cuisine.tsx
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin, Clock, Search, Filter, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const API_URL = "/api/posts";
const BACKEND_URL = "http://localhost:5000";

interface Dish {
  _id: string;
  title: string;
  content: string;
  images: string[];
  price?: number;
  foodType?: string;
  status: 'draft' | 'published';
  createdAt: string;
  ratingAverage: number;   // THÊM
  ratingCount: number;     // THÊM
}

const Cuisine = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPrice, setFilterPrice] = useState("all");

  const navigate = useNavigate();

  const foodTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'mon_chinh', label: 'Món chính' },
    { value: 'mon_nhe', label: 'Món nhẹ' },
    { value: 'trang_mieng', label: 'Tráng miệng' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?category=am_thuc&status=published`);
      if (res.ok) {
        const data: Dish[] = await res.json();
        setDishes(data);
      } else {
        throw new Error("Không thể tải dữ liệu");
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Không thể tải dữ liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number | string) => {
    if (!price) return "Liên hệ";
    const p = typeof price === "string" ? parseInt(price) : price;
    return `${p.toLocaleString()}đ`;
  };

  const handleSearchDish = (dishName: string) => {
    const query = `${dishName} Đà Nẵng`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || dish.foodType === filterType;
    
    const price = dish.price || 0;
    const matchesPrice = filterPrice === "all" ||
      (filterPrice === "low" && price < 20000) ||
      (filterPrice === "medium" && price >= 20000 && price <= 50000) ||
      (filterPrice === "high" && price > 50000);

    return matchesSearch && matchesType && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/90 to-primary/90 z-10" />
          <div className="absolute inset-0">
            {dishes[0]?.images?.[0] ? (
              <img
                src={dishes[0].images[0].startsWith('http') ? dishes[0].images[0] : `${BACKEND_URL}${dishes[0].images[0]}`}
                alt="Ẩm thực Đà Nẵng"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-gradient-to-br from-orange-400 to-red-600 w-full h-full" />
            )}
          </div>
          <div className="relative z-20 text-center text-white">
            <Badge className="mb-4 hero-gradient text-white">Ẩm thực</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Ẩm thực Đà Nẵng
            </h1>
            <p className="text-xl max-w-2xl mx-auto">
              Khám phá hương vị đặc sắc của vùng đất miền Trung
            </p>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="py-6 bg-muted/20">
          <div className="container mx-auto px-4">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm món ăn..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Loại món" />
                  </SelectTrigger>
                  <SelectContent>
                    {foodTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPrice} onValueChange={setFilterPrice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mức giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="low">Dưới 20k</SelectItem>
                    <SelectItem value="medium">20k - 50k</SelectItem>
                    <SelectItem value="high">Trên 50k</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="hero-gradient text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  Lọc
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Featured Dishes */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 sunset-gradient text-white">Món ăn đặc sản</Badge>
              <h2 className="text-4xl font-bold mb-4">
                Những món ăn <span className="text-accent">không thể bỏ qua</span>
              </h2>
            </div>

            {filteredDishes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Không tìm thấy món ăn nào</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDishes.map((dish) => (
                  <Card key={dish._id} className="group card-hover border-0 shadow-lg overflow-hidden">
                    <div className="relative overflow-hidden">
                      {dish.images?.[0] ? (
                        <img
                          src={dish.images[0].startsWith('http') ? dish.images[0] : `${BACKEND_URL}${dish.images[0]}`}
                          alt={dish.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="bg-muted w-full h-48 flex items-center justify-center">
                          <Utensils className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-black/20 text-white">
                          {foodTypes.find(t => t.value === dish.foodType)?.label || "Món ăn"}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">{dish.title}</h3>
                        <div className="flex items-center space-x-1 text-sm">
                          {dish.ratingAverage > 0 ? (
                            <>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{dish.ratingAverage.toFixed(1)}</span>
                              <span className="text-muted-foreground">({dish.ratingCount})</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">Chưa có đánh giá</span>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {dish.content?.slice(0, 100)}...
                      </p>

                      {dish.price && (
                        <div className="flex items-center mb-4">
                          <span className="text-lg font-bold text-accent">
                            {formatPrice(dish.price)}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="w-full sunset-gradient hover:opacity-90 text-white"
                          onClick={() => handleSearchDish(dish.title)}
                        >
                          Tìm quán
                        </Button>
                        <Button
                          className="w-full hero-gradient hover:opacity-90 text-white"
                          onClick={() => navigate(`/cuisine/${dish._id}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Cuisine; 
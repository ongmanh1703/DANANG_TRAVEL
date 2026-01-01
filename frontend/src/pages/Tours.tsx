// src/pages/Tours.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users, Calendar, Clock, Search, Filter, MapPin, Star
} from 'lucide-react';

const API_URL = "http://localhost:5000";

interface Review {
  _id: string;
  rating: number;
  content: string;
  user: { name: string };
}

interface Tour {
  _id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  duration: string;
  groupSize?: string;
  highlights: string[];
  departure?: string;
  category?: string;
  includes: string[];
  status: string;
  description?: string;
}

// Thêm interface để lưu cả reviews
interface TourWithRating extends Tour {
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
}

const Tours = () => {
  const [tours, setTours] = useState<TourWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  const navigate = useNavigate();

  // Tải tours + reviews song song
  useEffect(() => {
    const loadToursWithRatings = async () => {
      try {
        const [toursRes] = await Promise.all([
          fetch(`${API_URL}/api/tours?status=published`),
        ]);

        if (!toursRes.ok) throw new Error("Không tải được tour");

        const toursData: Tour[] = await toursRes.json();

        // Lấy reviews cho tất cả tour cùng lúc
        const tourIds = toursData.map(t => t._id);
        const reviewsPromises = tourIds.map(id =>
          fetch(`${API_URL}/api/reviews/tour/${id}`).then(r => r.ok ? r.json() : [])
        );

        const reviewsArrays = await Promise.all(reviewsPromises);

        // Gắn reviews vào từng tour và tính rating
        const toursWithRatings: TourWithRating[] = toursData.map((tour, index) => {
          const reviews = reviewsArrays[index] || [];
          const reviewCount = reviews.length;
          const avgRating = reviewCount > 0
            ? Number((reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewCount).toFixed(1))
            : 0;

          return {
            ...tour,
            reviews,
            avgRating,
            reviewCount,
          };
        });

        setTours(toursWithRatings);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    loadToursWithRatings();
  }, []);

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || (tour.category || "").toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesDuration = durationFilter === "all" ||
        (durationFilter === "full" && tour.duration.toLowerCase().includes("ngày") && !tour.duration.toLowerCase().includes("nhiều")) ||
        (durationFilter === "multi" && tour.duration.toLowerCase().includes("nhiều"));
      const matchesPrice = priceFilter === "all" ||
        (priceFilter === "low" && tour.price < 500000) ||
        (priceFilter === "medium" && tour.price >= 500000 && tour.price <= 1000000) ||
        (priceFilter === "high" && tour.price > 1000000);

      return matchesSearch && matchesCategory && matchesDuration && matchesPrice;
    });
  }, [tours, searchTerm, categoryFilter, durationFilter, priceFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getDiscountPercent = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round((1 - price / originalPrice) * 100);
  };

  // Component hiển thị sao
  const RatingStars = ({ rating, count }: { rating: number; count: number }) => {
    if (count === 0) return <span className="text-gray-400 text-sm">Chưa có đánh giá</span>;

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-yellow-600">{rating}</span>
        <span className="text-xs text-gray-500">({count} đánh giá)</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
<section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-primary/90 z-10" />

  <div className="absolute inset-0">
    {tours[0]?.image ? (
      <img
        src={
          tours[0].image.startsWith("http")
            ? tours[0].image
            : `${API_URL}${tours[0].image}`
        }
        alt="Tour nổi bật"
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-teal-600" />
    )}
  </div>

  <div className="relative z-20 text-center text-white px-4">
    <Badge className="mb-4 bg-white/20 text-white border-white/30">
      Tour du lịch
    </Badge>
    <h1 className="text-5xl md:text-6xl font-bold mb-6">
      Tour được yêu thích
    </h1>
    <p className="text-xl max-w-2xl mx-auto">
      Khám phá Đà Nẵng với những tour du lịch hấp dẫn và giá tốt nhất
    </p>
  </div>
</section>

        {/* Search & Filter */}
        <section className="py-6 bg-muted/20">
          <div className="container mx-auto px-4">
            <Card className="p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
                <div className="relative md:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm tour..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                <div className="md:flex-1">
                  <Select value={durationFilter} onValueChange={setDurationFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="full">1 ngày</SelectItem>
                      <SelectItem value="multi">Nhiều ngày</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:flex-1">
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="low">Dưới 500k</SelectItem>
                      <SelectItem value="medium">500k - 1tr</SelectItem>
                      <SelectItem value="high">Trên 1tr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:w-[160px]">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600">
                    <Filter className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Tours Grid */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Đang tải tour...</p>
              </div>
            ) : filteredTours.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">Không tìm thấy tour nào phù hợp.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTours.map((tour) => (
                  <Card
                    key={tour._id}
                    className="group card-hover border-0 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="relative overflow-hidden">
                      {tour.image ? (
                        <img
                          src={tour.image.startsWith('http') ? tour.image : `${API_URL}${tour.image}`}
                          alt={tour.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center">
                          <MapPin className="h-16 w-16 text-white opacity-70" />
                        </div>
                      )}
                      {tour.category && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-gradient-to-r from-teal-500 to-blue-600 text-white text-xs">
                            {tour.category}
                          </Badge>
                        </div>
                      )}
                      {tour.originalPrice && tour.originalPrice > tour.price && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          -{getDiscountPercent(tour.price, tour.originalPrice)}%
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900">
                        {tour.title}
                      </h3>

                      {/* Rating hiển thị ngay dưới tiêu đề */}
                      <div className="mb-3">
                        <RatingStars rating={tour.avgRating} count={tour.reviewCount} />
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{tour.duration}</span>
                        </div>
                        {tour.groupSize && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{tour.groupSize}</span>
                          </div>
                        )}
                      </div>

                      {tour.departure && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Địa điểm: {tour.departure}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-secondary">
                            {formatPrice(tour.price)}
                          </span>
                          {tour.originalPrice && tour.originalPrice > tour.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(tour.originalPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">/người</span>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium"
                        onClick={() => navigate(`/book-tour/${tour._id}`)}
                      >
                        Đặt tour ngay
                      </Button>
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

export default Tours;
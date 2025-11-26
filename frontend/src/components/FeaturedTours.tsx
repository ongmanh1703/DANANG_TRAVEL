import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

interface TourWithRating extends Tour {
  avgRating: number;
  reviewCount: number;
}

const FeaturedTours = () => {
  const [featuredTours, setFeaturedTours] = useState<TourWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeaturedTours = async () => {
      try {
        const toursRes = await fetch(`${API_URL}/api/tours?status=published`);
        if (!toursRes.ok) throw new Error("Không tải được tour");

        const toursData: Tour[] = await toursRes.json();

        const reviewsPromises = toursData.map(tour =>
          fetch(`${API_URL}/api/reviews/tour/${tour._id}`)
            .then(r => r.ok ? r.json() : [])
        );

        const reviewsArrays = await Promise.all(reviewsPromises);

        const toursWithRatings: TourWithRating[] = toursData.map((tour, index) => {
          const reviews = reviewsArrays[index] || [];
          const reviewCount = reviews.length;
          const avgRating = reviewCount > 0
            ? Number((reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewCount).toFixed(1))
            : 0;

          return {
            ...tour,
            avgRating,
            reviewCount,
          };
        });

        const featured = toursWithRatings
          .filter(tour => 
            tour.reviewCount > 0 && 
            tour.avgRating >= 4.5 &&
            tour.image
          )
          .sort((a, b) => {
            if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
            if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
            const discountA = a.originalPrice ? (1 - a.price / a.originalPrice) : 0;
            const discountB = b.originalPrice ? (1 - b.price / b.originalPrice) : 0;
            return discountB - discountA;
          })
          .slice(0, 3);

        setFeaturedTours(featured.length > 0 ? featured : toursWithRatings.slice(0, 3));
      } catch (err) {
        console.error("Lỗi tải tour nổi bật:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTours();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getDiscountPercent = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round((1 - price / originalPrice) * 100);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Đang tải tour nổi bật...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 sunset-gradient text-white">Tour nổi bật</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Các tour
            <span className="text-secondary"> được yêu thích nhất</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Những chuyến đi hot nhất, được hàng ngàn du khách đánh giá cao
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTours.map((tour) => (
            <Card key={tour._id} className="group card-hover border-0 shadow-lg overflow-hidden">
              <div className="relative overflow-hidden">
                <img
                  src={tour.image.startsWith('http') ? tour.image : `${API_URL}${tour.image}`}
                  alt={tour.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="tropical-gradient text-white text-xs">
                    {tour.category || 'Tour hot'}
                  </Badge>
                </div>
                {getDiscountPercent(tour.price, tour.originalPrice) && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    -{getDiscountPercent(tour.price, tour.originalPrice)}%
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{tour.title}</h3>

                <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
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

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{tour.avgRating || 'Mới'}</span>
                    <span className="text-muted-foreground text-sm">
                      ({tour.reviewCount} đánh giá)
                    </span>
                  </div>
                  {tour.departure && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{tour.departure}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {tour.highlights?.slice(0, 3).map((highlight, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                  {tour.highlights && tour.highlights.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{tour.highlights.length - 3} khác
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-primary">
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
                  className="w-full sunset-gradient hover:opacity-90 text-white"
                  onClick={() => navigate(`/book-tour/${tour._id}`)}
                >
                  Đặt tour ngay
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTours;
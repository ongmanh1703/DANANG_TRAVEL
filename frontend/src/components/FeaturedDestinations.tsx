// src/components/FeaturedDestinations.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "/api/posts";
const BACKEND_URL = "http://localhost:5000";

interface Destination {
  _id: string;
  title: string;
  images: string[];
  place?: string;
  duration?: string;
  content: string;
  placeType?: string;
  ratingAverage: number;
  ratingCount: number;
}

const FeaturedDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}?category=kham_pha&status=published&limit=10`);
        if (!res.ok) throw new Error("Không tải được điểm đến");

        const data: Destination[] = await res.json();

        const valid = data
          .filter(d => d.images && d.images.length > 0)
          .filter(d => d.ratingCount > 0)
          .sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount)
          .slice(0, 3);

        setDestinations(valid);
      } catch (err) {
        console.error("Lỗi tải điểm đến nổi bật:", err);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const getPlaceTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      bai_bien: "Bãi biển",
      nui_rung: "Núi rừng",
      tam_linh: "Tâm linh",
      vui_choi: "Vui chơi",
      van_hoa: "Văn hóa",
    };
    return map[type || ""] || "Khám phá";
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 hero-gradient text-white">Điểm đến nổi bật</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Khám phá những địa điểm <span className="text-primary">tuyệt vời</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Từ những thắng cảnh thiên nhiên hùng vĩ đến các di tích lịch sử độc đáo
          </p>
        </div>

        {destinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <Card
                key={dest._id}
                className="group card-hover border-0 shadow-lg overflow-hidden cursor-pointer"
                onClick={() => navigate(`/destinations/${dest._id}`)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={
                      dest.images[0].startsWith("http")
                        ? dest.images[0]
                        : `${BACKEND_URL}${dest.images[0]}`
                    }
                    alt={dest.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="tropical-gradient text-white">
                      {getPlaceTypeLabel(dest.placeType)}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold line-clamp-2">{dest.title}</h3>
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {dest.ratingAverage.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({dest.ratingCount})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                    {dest.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{dest.duration}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{dest.place || "Đà Nẵng"}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {dest.content.length > 120
                      ? dest.content.slice(0, 120) + "..."
                      : dest.content}
                  </p>

                  <Button
                    className="w-full hero-gradient hover:opacity-90 text-white font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/destinations/${dest._id}`);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground text-xl">
            Chưa có điểm đến nào được đánh giá cao
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedDestinations;
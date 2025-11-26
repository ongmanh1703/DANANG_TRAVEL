import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const BACKEND_URL = "http://localhost:5000";

interface Post {
  _id: string;
  title: string;
  content?: string;
  images?: string[];
  category?: string;
  status?: 'draft' | 'published';
  createdAt?: string;
  newsType?: string;
  isFeatured?: boolean;
}

const News = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [featuredNews, setFeaturedNews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const navigate = useNavigate();

  const newsTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'tin_du_lich', label: 'Tin du lịch' },
    { value: 'su_kien', label: 'Sự kiện' },
    { value: 'le_hoi', label: 'Lễ hội' },
    { value: 'cam_nang', label: 'Cẩm nang' },
    { value: 'review', label: 'Review' },
  ];

  // 🔸 Lấy tin nổi bật
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/posts/featured');
        if (res.ok) {
          const data = await res.json();
          setFeaturedNews(data);
        }
      } catch (err) {
        console.error("Lỗi tải tin nổi bật:", err);
      }
    };
    fetchFeatured();
  }, []);

  // 🔸 Lấy tất cả tin tức
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/posts?category=tin_tuc&status=published`);
        if (res.ok) {
          const data = await res.json();
          const sorted = data.sort(
            (a: Post, b: Post) =>
              new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
          );
          setAllPosts(sorted);
        }
      } catch (err) {
        toast({
          title: "Lỗi mạng",
          description: "Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // 🔸 Định dạng ngày
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Không rõ ngày";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // 🔸 Cắt nội dung (fix lỗi .replace undefined)
  const getExcerpt = (content?: string, length = 120) => {
    const text = (content ?? "").replace(/<[^>]*>/g, "");
    return text.length > length ? text.slice(0, length) + "..." : text;
  };

  // 🔸 Lọc bài viết
  const filteredPosts = allPosts
    .filter(post => post.status === 'published')
    .filter(post => {
      const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || post.newsType === selectedType;
      return matchesSearch && matchesType;
    });

  // 🔸 Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* 🔹 Hero section */}
        {featuredNews[0] && (
          <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/90 z-10" />
            <div className="absolute inset-0">
              <img
                src={
                  featuredNews[0].images?.[0]?.startsWith('http')
                    ? featuredNews[0].images?.[0]
                    : `${BACKEND_URL}${featuredNews[0].images?.[0] ?? ""}`
                }
                alt={featuredNews[0].title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-20 text-center text-white max-w-4xl px-4">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Tin tức</h1>
              <p className="text-lg md:text-xl text-white/90">
                Cập nhật các sự kiện, lễ hội và thông tin du lịch mới nhất tại Đà Nẵng
              </p>
            </div>
          </section>
        )}

        {/* 🔹 Thanh tìm kiếm */}
        <section className="py-6 bg-muted/20">
          <div className="container mx-auto px-4 flex justify-center">
            <Card className="p-6 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg backdrop-blur-sm bg-white/90">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm tin tức..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Loại tin tức" />
                  </SelectTrigger>
                  <SelectContent>
                    {newsTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button className="hero-gradient text-white w-full md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Lọc kết quả
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* 🔹 Tin nổi bật */}
        {featuredNews.length > 0 && (
          <section className="py-12 bg-gradient-to-b from-amber-50 to-transparent">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <Badge className="mb-3 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  <Star className="h-4 w-4 mr-1" /> Tin nổi bật
                </Badge>
                <h2 className="text-4xl font-bold">
                  Tin tức <span className="text-primary">đặc sắc</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredNews.map((news) => (
                  <Card key={news._id} className="group card-hover overflow-hidden border-2 border-amber-200">
                    <div className="relative">
                      <img
                        src={
                          news.images?.[0]
                            ? `${BACKEND_URL}${news.images?.[0]}`
                            : "/placeholder.svg"
                        }
                        alt={news.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition"
                      />
                      <Badge className="absolute top-2 right-2 bg-red-600 text-white animate-pulse">
                        Nổi bật
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg line-clamp-2 mb-2">{news.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {getExcerpt(news.content, 80)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(news.createdAt)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                        onClick={() => navigate(`/news/${news._id}`)}
                      >
                        Đọc ngay
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 🔹 Tất cả tin tức */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Tất cả tin tức</h2>

            {filteredPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Chưa có bài viết nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((news) => (
                  <Card key={news._id} className="group card-hover overflow-hidden">
                    <div className="relative">
                      <img
                        src={
                          news.images?.[0]
                            ? `${BACKEND_URL}${news.images?.[0]}`
                            : "/placeholder.svg"
                        }
                        alt={news.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition"
                      />
                      <Badge className="absolute top-2 left-2 bg-black/60 text-white text-xs">
                        {newsTypes.find(t => t.value === news.newsType)?.label || "Tin tức"}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">{news.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {getExcerpt(news.content, 70)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(news.createdAt)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => navigate(`/news/${news._id}`)}
                      >
                        Đọc tiếp
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

export default News;

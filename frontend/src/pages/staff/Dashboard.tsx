import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  MessageSquare,
  Newspaper,
  MapPin,
  Utensils,
  Compass,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type BookingStatus = "confirmed" | "paid_pending" | "paid" | "cancelled";

interface Booking {
  _id: string;
  status: BookingStatus;
}

interface Review {
  _id: string;
  reply?: any;
}

interface Post {
  _id: string;
  createdAt?: string;
}

interface Stats {
  pendingBookings: number;
  newReviews: number;
  todayPosts: number;
  totalPublishedPosts: number;
}

export default function StaffDashboard() {
  const { toast } = useToast();

  const [stats, setStats] = useState<Stats>({
    pendingBookings: 0,
    newReviews: 0,
    todayPosts: 0,
    totalPublishedPosts: 0,
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Lấy dữ liệu thật từ backend
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Chưa đăng nhập",
          description: "Vui lòng đăng nhập lại để xem Dashboard nhân viên",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const authHeader = { Authorization: `Bearer ${token}` };

        const [bookingsRes, reviewsRes, postsRes] = await Promise.all([
          fetch(`${API_URL}/api/bookings/all`, {
            headers: authHeader,
          }),
          fetch(`${API_URL}/api/reviews/all`, {
            headers: authHeader,
          }),
          fetch(`${API_URL}/api/posts`), // public, không cần token
        ]);

        let pendingBookings = 0;
        let newReviews = 0;
        let todayPosts = 0;
        let totalPublishedPosts = 0;

        // Đơn đặt tour
        if (bookingsRes.ok) {
          const bookings: Booking[] = await bookingsRes.json();
          // "Đặt tour đang chờ": gom cả CHỜ THANH TOÁN + ĐÃ THANH TOÁN CHỜ DUYỆT
          pendingBookings = bookings.filter(
            (b) => b.status === "confirmed" || b.status === "paid_pending"
          ).length;
        } else {
          const err = await bookingsRes.json().catch(() => ({}));
          throw new Error(err.message || "Không thể tải danh sách đặt tour");
        }

        // Đánh giá
        if (reviewsRes.ok) {
          const reviews: Review[] = await reviewsRes.json();
          // "Đánh giá chưa trả lời": review chưa có reply
          newReviews = reviews.filter((r) => !r.reply).length;
        } else {
          const err = await reviewsRes.json().catch(() => ({}));
          throw new Error(err.message || "Không thể tải danh sách đánh giá");
        }

        // Bài viết
        if (postsRes.ok) {
          const posts: Post[] = await postsRes.json();
          totalPublishedPosts = posts.length;
          const today = new Date();
          todayPosts = posts.filter((p) =>
            p.createdAt ? isSameDay(new Date(p.createdAt), today) : false
          ).length;
        } else {
          const err = await postsRes.json().catch(() => ({}));
          throw new Error(err.message || "Không thể tải danh sách bài viết");
        }

        setStats({
          pendingBookings,
          newReviews,
          todayPosts,
          totalPublishedPosts,
        });
        setLastUpdated(new Date());
      } catch (err: any) {
        toast({
          title: "Lỗi tải Dashboard",
          description: err.message || "Không thể lấy dữ liệu thống kê",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const quickLinks = [
    {
      title: "Xử lý đặt tour",
      icon: Calendar,
      count: stats.pendingBookings,
      href: "/staff/bookings",
      color: "text-purple-600",
    },
    {
      title: "Trả lời đánh giá",
      icon: MessageSquare,
      count: stats.newReviews,
      href: "/staff/reviews",
      color: "text-orange-600",
    },
    {
      title: "Quản lý Tours",
      icon: Compass,
      count: null,
      href: "/staff/tours",
      color: "text-indigo-600",
    },
    {
      title: "Thêm tin tức",
      icon: Newspaper,
      count: null,
      href: "/staff/news",
      color: "text-emerald-600",
    },
    {
      title: "Thêm địa điểm",
      icon: MapPin,
      count: null,
      href: "/staff/destinations",
      color: "text-blue-600",
    },
    {
      title: "Thêm món ăn",
      icon: Utensils,
      count: null,
      href: "/staff/cuisine",
      color: "text-rose-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tight">
              Chào mừng quay lại, Nhân viên!
            </h1>
            <p className="mt-3 text-lg opacity-95">
              Hôm nay là{" "}
              <span className="font-semibold">
                {format(
                  new Date(),
                  "EEEE, dd 'tháng' MM yyyy",
                  { locale: vi }
                )}
              </span>
            </p>
            <p className="mt-2 text-blue-100">
              {loading
                ? "Đang cập nhật số liệu thực tế..."
                : "Chúc bạn một ngày làm việc thật hiệu quả!"}
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-20">
            <Compass className="h-48 w-48" />
          </div>
        </div>

        {/* 2 Cards chính */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tour chờ */}
          <Card className="group relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-purple-900">
                  Đặt tour đang chờ
                </CardTitle>
                <div className="p-3 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Calendar className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-extrabold text-purple-700">
                {stats.pendingBookings}
              </div>
              <p className="mt-3 text-sm text-purple-600 flex items-center gap-2 font-medium">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                Cần xác nhận ngay hôm nay
              </p>
              <Button
                size="lg"
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 shadow-lg"
                asChild
              >
                <a href="/staff/bookings">Xử lý ngay</a>
              </Button>
            </CardContent>
          </Card>

          {/* Đánh giá */}
          <Card className="group relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-orange-900">
                  Đánh giá chưa trả lời
                </CardTitle>
                <div className="p-3 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
                  <MessageSquare className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-extrabold text-orange-700">
                {stats.newReviews}
              </div>
              <p className="mt-3 text-sm text-orange-600 font-medium">
                Khách hàng đang chờ phản hồi từ bạn
              </p>
              <Button
                size="lg"
                variant="outline"
                className="mt-6 w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                asChild
              >
                <a href="/staff/reviews">Xem & trả lời</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tổng quan */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-emerald-700 font-medium">
                Bài viết hôm nay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8" />
                {stats.todayPosts}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-700 font-medium">
                Tổng bài đã đăng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 flex items-center gap-3">
                <TrendingUp className="h-8 w-8" />
                {stats.totalPublishedPosts}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tác vụ nhanh */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
            <Compass className="h-7 w-7 text-indigo-600" />
            Tác vụ nhanh
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="group block transition-all"
              >
                <Card className="h-full rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className="p-4 rounded-xl bg-white shadow-md border border-slate-100 group-hover:shadow-lg transition-all">
                      <link.icon
                        className={`h-8 w-8 ${link.color} group-hover:scale-125 transition-transform`}
                      />
                    </div>

                    {/* Title */}
                    <p className="font-semibold text-foreground text-base tracking-tight">
                      {link.title}
                    </p>

                    {/* Badge nếu có số */}
                    {link.count !== null && (
                      <Badge
                        variant={link.count > 10 ? "destructive" : "secondary"}
                        className="text-sm font-bold px-3 py-1"
                      >
                        {link.count}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Đà Nẵng Tourism – Staff Panel •{" "}
            <span className="text-foreground/80">
              Cập nhật lúc{" "}
              {lastUpdated
                ? format(lastUpdated, "HH:mm")
                : format(new Date(), "HH:mm")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

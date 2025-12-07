// src/pages/DestinationDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Clock,
  ArrowLeft,
  Camera,
  MessageCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = "/api/posts";
const BACKEND_URL = "http://localhost:5000";

// 🔹 LOGO ĐÀ NẴNG TRAVEL
import logo from "@/assets/logo.png";

/* === XỬ LÝ ẢNH AN TOÀN GIỐNG NewsDetail === */
const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.svg";
  if (imagePath.startsWith("data:")) return imagePath;
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BACKEND_URL}${cleanPath}`;
};

const getYouTubeEmbed = (url: string) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {}
  return null;
};

interface Review {
  _id: string;
  rating: number;
  content: string;
  user: {
    name: string;
    avatar?: string;
  } | null;
  createdAt: string;
  reply?: {
    content: string;
    admin: {
      name: string;
      avatar?: string;
    };
    repliedAt: string;
  };
}

interface Post {
  _id: string;
  title: string;
  images: string[];
  videoUrl?: string;
  place?: string;
  duration?: string;
  content: string;
  overview?: string;
  history?: string;
  notes?: string;
  highlights?: string[];
  ratingAverage: number;
  ratingCount: number;
  reviews: Review[];
}

const DestinationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 0, content: "" });
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDialogElement>(null);
  const modalImgRef = useRef<HTMLImageElement>(null);

  const openImageModal = (src: string) => {
    if (modalImgRef.current) modalImgRef.current.src = src;
    modalRef.current?.showModal();
  };

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error("Không tìm thấy điểm đến");
        const data: Post = await res.json();

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userRes = await fetch(`/api/reviews/user/${id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            if (userRes.ok) {
              const userRev = await userRes.json();
              setUserReview(userRev);
              setNewReview({ rating: userRev.rating, content: userRev.content });
            }
          } catch (err) {
            console.log("Chưa có đánh giá");
          }
        }

        setDestination(data);
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        navigate("/explore");
      } finally {
        setLoading(false);
      }
    };
    fetchDestination();
  }, [id, navigate]);

  // GỬI / CẬP NHẬT ĐÁNH GIÁ
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.rating || !newReview.content.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn sao và nhập bình luận",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để gửi đánh giá",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: id,
          rating: newReview.rating,
          content: newReview.content,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gửi thất bại");

      const updatedReview: Review = result.review;
      const { ratingAverage, ratingCount } = result.post;

      setUserReview(updatedReview);

      setDestination((prev) => {
        if (!prev) return null;
        const exists = prev.reviews.some((r) => r._id === updatedReview._id);
        return {
          ...prev,
          reviews: exists
            ? prev.reviews.map((r) =>
                r._id === updatedReview._id ? updatedReview : r
              )
            : [updatedReview, ...prev.reviews],
          ratingAverage,
          ratingCount,
        };
      });

      setIsEditing(false);
      toast({ title: "Thành công!", description: "Đánh giá đã được gửi!" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // XÓA ĐÁNH GIÁ
  const handleDeleteReview = async () => {
    const token = localStorage.getItem("token");
    if (!token || !userReview) return;

    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setUserReview(null);
      setNewReview({ rating: 0, content: "" });

      setDestination((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          reviews: prev.reviews.filter((r) => r._id !== userReview._id),
          ratingAverage: result.post.ratingAverage,
          ratingCount: result.post.ratingCount,
        };
      });

      toast({ title: "Đã xóa", description: "Đánh giá đã được xóa" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!destination) return null;

  const images =
    destination.images?.map((img) =>
      img.startsWith("http") ? img : `${BACKEND_URL}${img}`
    ) || [];
  const videoEmbed = destination.videoUrl
    ? getYouTubeEmbed(destination.videoUrl)
    : null;

  /* === REVIEW CARD – GIỐNG NewsDetail / DishDetail === */
  const ReviewCard = ({ review, isUser }: { review: Review; isUser: boolean }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const displayName = review.user?.name || "Khách vãng lai";
    const initials = displayName.charAt(0).toUpperCase();
    const avatarUrl = getImageUrl(review.user?.avatar);

    const formatDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const timeAgo = (date: string) =>
      formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });

    return (
      <div
        className={`p-6 rounded-2xl border ${
          isUser
            ? "bg-indigo-50/80 border-indigo-300"
            : "bg-white border-gray-200"
        } shadow-sm hover:shadow-md transition`}
      >
        <div className="flex gap-5">
          {/* Avatar người dùng */}
          <div className="flex-shrink-0">
            {avatarUrl && avatarUrl !== "/placeholder.svg" ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-bold text-lg ${
                      isUser ? "text-indigo-700" : "text-gray-900"
                    }`}
                  >
                    {displayName}
                  </span>
                  {isUser && (
                    <Badge variant="secondary" className="text-xs">
                      Bạn
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-indigo-600">
                    {timeAgo(review.createdAt)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>

              {isUser && !isEditing && (
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="hover:bg-indigo-100 rounded-full"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </Button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border z-20">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteReview();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 text-gray-700 leading-relaxed">{review.content}</p>

            {/* PHẢN HỒI TỪ ĐÀ NẴNG TRAVEL – giống NewsDetail / DishDetail */}
            {review.reply && (
              <div className="mt-6 ml-12 pl-6 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl p-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={logo}
                      alt="Đà Nẵng Travel"
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-lg"
                    />
                  </div>
                  <div className="flex-1">
                    {/* ✅ Chỉ 1 lần chữ Đà Nẵng Travel */}
                    <div className="font-bold text-emerald-800 mb-1">
                      Đà Nẵng Travel
                    </div>
                    <p className="text-gray-800 leading-relaxed">
                      {review.reply.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {timeAgo(review.reply.repliedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative h-[75vh] w-full">
        {images[0] ? (
          <img
            src={images[0]}
            alt={destination.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="bg-gradient-to-br from-blue-600 to-teal-700 w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg">
            {destination.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white mt-3 text-sm md:text-base">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span>
                {destination.ratingAverage > 0
                  ? destination.ratingAverage.toFixed(1)
                  : "Chưa có"}{" "}
                {destination.ratingCount > 0 && `(${destination.ratingCount})`}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-90">
              <MapPin className="h-5 w-5" />
              <span>{destination.place || "Đà Nẵng"}</span>
            </div>
            <div className="flex items-center gap-1 opacity-90">
              <Clock className="h-5 w-5" />
              <span>{destination.duration || "Liên hệ"}</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 max-w-6xl py-16 space-y-16">
        {/* HÌNH ẢNH NỔI BẬT */}
        {images.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Hình ảnh nổi bật</h2>

            <dialog
              ref={modalRef}
              className="fixed inset-0 z-50 m-auto max-w-4xl w-[90vw] bg-black/95 backdrop:bg-black/80 open:flex open:items-center open:justify-center border-0 rounded-xl overflow-hidden"
            >
              <div className="relative">
                <img
                  ref={modalImgRef}
                  src=""
                  alt="Xem lớn"
                  className="max-w-full max-h-[90vh] object-contain"
                />
                <button
                  onClick={() => modalRef.current?.close()}
                  className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black/80 rounded-full p-3 transition"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </dialog>

            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              <div
                className="flex gap-5 animate-marquee hover:[animation-play-state:paused]"
                style={{
                  width: "max-content",
                  animation: "marquee 35s linear infinite",
                }}
              >
                {[...images, ...images].map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => openImageModal(img)}
                    className="relative group overflow-hidden rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-transform hover:scale-[1.02]"
                  >
                    <img
                      src={img}
                      alt={`gallery-${idx}`}
                      className="h-56 md:h-64 w-[320px] md:w-[380px] object-cover rounded-2xl transition-transform group-hover:scale-105 duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <Camera className="h-12 w-12 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>

        {/* GIỚI THIỆU */}
        <section className="bg-muted/30 rounded-2xl p-8 shadow-md">
          <h2 className="text-3xl font-bold mb-4">Giới thiệu</h2>
          <p className="text-gray-700 leading-relaxed text-lg text-justify whitespace-pre-line">
            {destination.content}
          </p>
        </section>

        {/* VIDEO */}
        {videoEmbed && (
          <section className="rounded-2xl overflow-hidden shadow-md">
            <h2 className="text-3xl font-bold mb-4">Video giới thiệu</h2>
            <div
              className="w-full rounded-xl overflow-hidden bg-black"
              style={{ aspectRatio: "16 / 9" }}
            >
              <iframe
                src={`${videoEmbed}?rel=0&modestbranding=1`}
                title="Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* TABS */}
        <section className="bg-muted/30 p-6 rounded-2xl shadow-md">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 md:gap-3 bg-muted rounded-xl p-2">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:shadow font-medium px-4 md:px-5 py-2 rounded-lg text-sm md:text-base"
              >
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-white data-[state=active]:shadow font-medium px-4 md:px-5 py-2 rounded-lg text-sm md:text-base"
              >
                Lịch sử
              </TabsTrigger>
              <TabsTrigger
                value="tips"
                className="data-[state=active]:bg-white data-[state=active]:shadow font-medium px-4 md:px-5 py-2 rounded-lg text-sm md:text-base"
              >
                Lưu ý
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-indigo-600">
                    Giới thiệu tổng quan
                  </h3>
                  <p className="text-gray-700 text-justify whitespace-pre-line leading-relaxed">
                    {destination.overview || "Chưa có thông tin tổng quan."}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="history">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-teal-600">
                    Lịch sử
                  </h3>
                  <p className="text-gray-700 text-justify whitespace-pre-line leading-relaxed">
                    {destination.history || "Chưa có thông tin lịch sử."}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="tips">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-amber-600">
                    Lưu ý khi tham quan
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {destination.notes ||
                      "• Mang theo nước uống và kem chống nắng\n• Mặc đồ thoải mái, giày thể thao\n• Kiểm tra thời tiết trước khi đi"}
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </section>

        {/* ĐIỂM NỔI BẬT */}
        {destination.highlights?.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Điểm nổi bật</h2>
            <div className="flex flex-wrap gap-3">
              {destination.highlights.map((h, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-sm px-4 py-2 rounded-full shadow-sm"
                >
                  {h}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* ĐÁNH GIÁ & BÌNH LUẬN */}
        <section
          id="reviews-section"
          className="bg-white rounded-3xl shadow-xl p-8 border"
        >
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-indigo-600" />
            Đánh giá & Bình luận
          </h2>

          {/* Form đánh giá */}
          {(!userReview || isEditing) && (
            <form
              onSubmit={handleReviewSubmit}
              className="mb-10 pb-10 border-b-2"
            >
              <div className="mb-6">
                <p className="font-medium mb-3 text-lg">
                  Chọn số sao của bạn
                </p>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                      className={`w-12 h-12 cursor-pointer transition hover:scale-110 ${
                        star <= newReview.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none resize-none text-base"
                rows={6}
                value={newReview.content}
                onChange={(e) =>
                  setNewReview({ ...newReview, content: e.target.value })
                }
              />

              <div className="flex gap-4 mt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8"
                >
                  {submitting
                    ? "Đang gửi..."
                    : isEditing
                    ? "Cập nhật đánh giá"
                    : "Gửi đánh giá"}
                </Button>
                {isEditing && userReview && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setNewReview({
                        rating: userReview.rating,
                        content: userReview.content,
                      });
                    }}
                  >
                    Hủy
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Danh sách đánh giá */}
          <div className="space-y-8">
            {destination.reviews.length === 0 ? (
              <div className="text-center py-20 text-gray-500 italic text-lg">
                Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm!
              </div>
            ) : (
              destination.reviews.map((review) => {
                const isUserReview = userReview?._id === review._id;
                return (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    isUser={isUserReview}
                  />
                );
              })
            )}
          </div>
        </section>

        {/* NÚT HÀNH ĐỘNG */}
        <section className="flex flex-col md:flex-row gap-4">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2 text-lg py-4 rounded-xl shadow"
            onClick={() => {
              const query = `${destination.title}, ${
                destination.place || ""
              }, Đà Nẵng`;
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  query
                )}`,
                "_blank"
              );
            }}
          >
            <MapPin className="h-5 w-5" /> Xem vị trí
          </Button>
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 text-lg py-4 rounded-xl shadow"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" /> Quay lại
          </Button>
        </section>
      </main>

      <Footer />
    </div>  
  );
};

export default DestinationDetail;

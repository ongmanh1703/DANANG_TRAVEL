// src/pages/DishDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  ArrowLeft,
  MapPin,
  UtensilsCrossed,
  MessageCircle,
  PlayCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = "/api/posts";
const BACKEND_URL = "http://localhost:5000";

// LOGO ĐÀ NẴNG TRAVEL
import logo from "@/assets/logo.png";

// XỬ LÝ ẢNH AN TOÀN
const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.svg";
  if (imagePath.startsWith("data:")) return imagePath;
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BACKEND_URL}${cleanPath}`;
};

// Xử lý video YouTube / MP4
const parseEmbed = (url: string) => {
  if (!url) return null;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return {
      kind: "video",
      src: url.startsWith("http") ? url : `${BACKEND_URL}${url}`,
    };
  }
  const yt = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  return null;
};

const MediaPlayer = ({ url, poster }: { url: string; poster?: string }) => {
  const info = parseEmbed(url);
  if (!info) return null;

  if (info.kind === "video") {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        className="w-full rounded-lg shadow-md"
        poster={poster}
      >
        <source src={info.src} type="video/mp4" />
        Trình duyệt không hỗ trợ video.
      </video>
    );
  }

  return (
    <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden shadow-md">
      <iframe
        src={info.src}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};

interface Review {
  _id: string;
  rating: number;
  content: string;
  user: { name: string; avatar?: string } | null;
  createdAt: string;
  reply?: {
    content: string;
    admin: { name?: string; avatar?: string };
    repliedAt: string;
  };
}

interface Dish {
  _id: string;
  title: string;
  images: string[];
  videoUrl?: string;
  content: string;
  place?: string;
  price?: number;
  ingredients?: string[];
  foodType?: string;
  ratingAverage: number;
  ratingCount: number;
  reviews: Review[];
}

const DishDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [newReview, setNewReview] = useState({ rating: 0, content: "" });
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDish = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error("Không tìm thấy món ăn");
        const data: Dish = await res.json();

        setDish(data);
        const firstImg = data.images?.[0];
        setMainImage(firstImg ? getImageUrl(firstImg) : "");

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userRes = await fetch(`/api/reviews/user/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (userRes.ok) {
              const userRev = await userRes.json();
              setUserReview(userRev);
              setNewReview({ rating: userRev.rating, content: userRev.content });
            }
          } catch {
            console.log("Chưa có đánh giá");
          }
        }
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        navigate("/cuisine");
      } finally {
        setLoading(false);
      }
    };
    fetchDish();
  }, [id, navigate]);

  const timeAgo = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

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
      setDish((prev) => {
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

  const handleDeleteReview = async () => {
    const token = localStorage.getItem("token");
    if (!token || !userReview || !window.confirm("Xóa đánh giá này?")) return;

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
      setDish(
        (prev) =>
          prev && {
            ...prev,
            reviews: prev.reviews.filter((r) => r._id !== userReview._id),
            ratingAverage: result.post.ratingAverage,
            ratingCount: result.post.ratingCount,
          }
      );

      toast({ title: "Đã xóa", description: "Đánh giá đã được xóa" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  const handleFindLocation = () => {
    if (!dish) return;
    const query = encodeURIComponent(`${dish.title} Đà Nẵng`);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!dish) return null;

  const ReviewCard = ({ review, isUser }: { review: Review; isUser: boolean }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const displayName = review.user?.name || "Khách vãng lai";
    const initials = displayName.charAt(0).toUpperCase();
    const avatarUrl = getImageUrl(review.user?.avatar);

    return (
      <div
        className={`p-6 rounded-2xl border ${
          isUser
            ? "bg-indigo-50/80 border-indigo-300"
            : "bg-white border-gray-200"
        } shadow-sm hover:shadow-md transition-all`}
      >
        <div className="flex gap-5">
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

            {/* Reply từ Đà Nẵng Travel – giống NewsDetail */}
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Nút điều hướng */}
          <div className="flex justify-center items-center gap-4 mb-10">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
            <Button
              onClick={handleFindLocation}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <MapPin className="h-4 w-4" /> Tìm quán
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Cột trái: Ảnh + video */}
            <div className="space-y-6">
              <img
                src={mainImage}
                alt={dish.title}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
              <div className="grid grid-cols-4 gap-3">
                {dish.images?.map((img, i) => {
                  const src = getImageUrl(img);
                  return (
                    <img
                      key={i}
                      src={src}
                      alt={`gallery-${i}`}
                      onClick={() => setMainImage(src)}
                      className={`h-24 w-full object-cover rounded-xl cursor-pointer transition ${
                        mainImage === src
                          ? "ring-2 ring-indigo-500"
                          : "hover:opacity-80"
                      }`}
                    />
                  );
                })}
              </div>

              {dish.videoUrl && (
                <div className="bg-white p-4 rounded-2xl shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayCircle className="h-5 w-5 text-rose-500" />
                    <p className="font-semibold">Video review / cách làm</p>
                  </div>
                  <MediaPlayer url={dish.videoUrl} poster={mainImage} />
                </div>
              )}
            </div>

            {/* Cột phải: Thông tin món */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  {dish.title}
                </h2>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {dish.ratingAverage.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({dish.ratingCount} đánh giá)
                  </span>
                </div>
                <p className="mt-4 text-gray-700 leading-relaxed text-justify">
                  {dish.content}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className="bg-orange-500 text-white">Đặc sản</Badge>
                  {dish.place && (
                    <Badge className="bg-blue-500 text-white">{dish.place}</Badge>
                  )}
                  {dish.foodType && (
                    <Badge className="bg-green-500 text-white">
                      {dish.foodType.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                {dish.price && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-2xl font-bold text-indigo-600">
                      {dish.price.toLocaleString()}đ
                    </p>
                  </div>
                )}
              </div>

              {dish.ingredients?.length > 0 && (
                <div className="bg-orange-50 p-6 rounded-2xl shadow-md">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-orange-500" /> Thành
                    phần
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {dish.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Đánh giá & bình luận */}
          <section className="mt-16 bg-white rounded-3xl shadow-xl p-8 border">
            <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-indigo-600" />
              Đánh giá & Bình luận
            </h3>

            {(!userReview || isEditing) && (
              <form onSubmit={handleReviewSubmit} className="mb-10 pb-10 border-b-2">
                <div className="mb-6">
                  <p className="font-medium mb-3 text-lg">Chọn số sao của bạn</p>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() =>
                          setNewReview({ ...newReview, rating: star })
                        }
                        className={`w-10 h-10 cursor-pointer transition hover:scale-110 ${
                          star <= newReview.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none text-base"
                  rows={5}
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

            <div className="space-y-8">
              {dish.reviews.length === 0 ? (
                <div className="text-center py-20 text-gray-500 italic text-lg">
                  Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm!
                </div>
              ) : (
                dish.reviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    isUser={userReview?._id === review._id}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DishDetail;

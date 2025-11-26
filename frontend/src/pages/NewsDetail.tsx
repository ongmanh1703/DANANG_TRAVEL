// frontend/src/pages/NewsDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, MessageCircle, Star, ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const BACKEND_URL = "http://localhost:5000";

/**
 * HÀM QUAN TRỌNG NHẤT – XỬ LÝ ẢNH AN TOÀN 100%
 * → Không bao giờ gây lỗi 431 dù ảnh là base64, đường dẫn, hay http
 */
const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.svg";

  // Trường hợp 1: Là base64 (data:image/...) → trả về luôn (dùng cho preview)
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }

  // Trường hợp 2: Là link đầy đủ → dùng luôn
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Trường hợp 3: Là đường dẫn tương đối từ server → ghép đúng
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BACKEND_URL}${cleanPath}`;
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
  content: string;
  images: string[];
  category: string;
  createdAt: string;
  views?: number;
  ratingAverage: number;
  ratingCount: number;
  reviews: Review[];
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [newReview, setNewReview] = useState({ rating: 0, content: "" });
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  useEffect(() => {
    if (post) fetchFeatured();
  }, [post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy bài viết");
      const data: Post = await res.json();

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
        } catch (err) {
          console.log("Chưa có đánh giá");
        }
      }
      setPost(data);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await fetch("/api/posts/featured");
      if (res.ok) {
        const data = await res.json();
        setFeaturedPosts(data.filter((p: Post) => p._id !== id));
      }
    } catch (err) {
      console.error("Lỗi tải tin nổi bật", err);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const timeAgo = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });

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
      setPost((prev) => {
        if (!prev) return null;
        const exists = prev.reviews.some((r) => r._id === updatedReview._id);
        return {
          ...prev,
          reviews: exists
            ? prev.reviews.map((r) => (r._id === updatedReview._id ? updatedReview : r))
            : [updatedReview, ...prev.reviews],
          ratingAverage,
          ratingCount,
        };
      });

      setIsEditing(false);
      toast({ title: "Thành công!", description: result.message });
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
      setPost((prev) => prev && {
        ...prev,
        reviews: prev.reviews.filter((r) => r._id !== userReview._id),
        ratingAverage: result.post.ratingAverage,
        ratingCount: result.post.ratingCount,
      });

      toast({ title: "Đã xóa", description: "Đánh giá đã được xóa" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-muted-foreground">
        Không tìm thấy bài viết!
      </div>
    );
  }

  const ReviewCard = ({ review, isUser }: { review: Review; isUser: boolean }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const displayName = review.user?.name || "Khách vãng lai";
    const initials = displayName.charAt(0).toUpperCase();
    const avatarUrl = getImageUrl(review.user?.avatar);

    return (
      <div className={`p-6 rounded-2xl border ${isUser ? "bg-indigo-50/80 border-indigo-300" : "bg-white border-gray-200"} shadow-sm hover:shadow-md transition`}>
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
                  <span className={`font-bold text-lg ${isUser ? "text-indigo-700" : "text-gray-900"}`}>
                    {displayName}
                  </span>
                  {isUser && <Badge variant="secondary" className="text-xs">Bạn</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-indigo-600">{timeAgo(review.createdAt)}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{formatDate(review.createdAt)}</span>
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
                        onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => { handleDeleteReview(); setMenuOpen(false); }}
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

            {/* Reply từ Admin */}
            {review.reply && (
              <div className="mt-6 ml-12 pl-6 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl p-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {review.reply.admin?.avatar ? (
                      <img
                        src={getImageUrl(review.reply.admin.avatar)}
                        alt={review.reply.admin.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-lg"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                        A
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-emerald-800 mb-1 flex items-center gap-2">
                      {review.reply.admin?.name || "Quản trị viên"}
                      <Badge variant="outline" className="text-xs">Admin</Badge>
                    </div>
                    <p className="text-gray-800 leading-relaxed">{review.reply.content}</p>
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

      {/* Hero Image */}
      <div className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
        <img
          src={getImageUrl(post.images[0])}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
          <div className="container mx-auto px-4 py-10 text-white">
            <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 mb-4">
              {post.category === "am_thuc" ? "Ẩm thực" : post.category === "tin_tuc" ? "Tin tức" : "Khám phá"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold max-w-5xl leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      <main className="py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pb-5 border-b">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(post.createdAt)}</div>
              <div className="flex items-center gap-2"><Eye className="w-4 h-4" /> {post.views || 0} lượt xem</div>
              <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> {post.reviews.length} đánh giá</div>
              {post.ratingAverage > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{post.ratingAverage.toFixed(1)}</span>
                </div>
              )}
            </div>

            <article
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <Button variant="outline" onClick={() => navigate(-1)} className="mb-10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>

            {/* Reviews Section */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-indigo-600" />
                Đánh giá & Bình luận
              </h2>

              {(!userReview || isEditing) && (
                <form onSubmit={handleReviewSubmit} className="mb-10 pb-10 border-b-2">
                  <div className="mb-6">
                    <p className="font-medium mb-3">Chọn số sao</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`w-10 h-10 cursor-pointer transition hover:scale-110 ${
                            star <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Viết đánh giá của bạn..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                    rows={5}
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  />
                  <div className="flex gap-4 mt-6">
                    <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {submitting ? "Đang gửi..." : isEditing ? "Cập nhật" : "Gửi đánh giá"}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={() => {
                        setIsEditing(false);
                        setNewReview({ rating: userReview!.rating, content: userReview!.content });
                      }}>
                        Hủy
                      </Button>
                    )}
                  </div>
                </form>
              )}

              <div className="space-y-8">
                {post.reviews.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 italic">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                  </div>
                ) : (
                  post.reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} isUser={userReview?._id === review._id} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Star className="w-7 h-7 text-yellow-500" />
                Tin nổi bật
              </h3>
              {featuredPosts.length > 0 ? (
                <div className="space-y-5">
                  {featuredPosts.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-xl transition"
                      onClick={() => navigate(`/news/${item._id}`)}
                    >
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.title}
                        className="w-24 h-20 object-cover rounded-lg group-hover:scale-105 transition"
                      />
                      <div>
                        <h4 className="font-medium line-clamp-3 group-hover:text-indigo-600">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Chưa có tin nổi bật</p>
              )}
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;
// src/pages/BookTour.tsx → HOÀN THIỆN 100% – CHỈ SỬA HIỂN THỊ ẢNH

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Star,
  ArrowLeft,
  MessageCircle,
  Calendar,
  Phone,
  User as UserIcon,
  Users,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = "http://localhost:5000";

/* ─────────────── HÀM CHUẨN HIỂN THỊ ẢNH – GIỐNG HỆT NewsDetail.tsx ─────────────── */
const getImageUrl = (path?: string): string => {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("data:")) return path;                    // base64 → dùng luôn
  if (path.startsWith("http")) return path;                     // link đầy đủ
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};
/* ─────────────────────────────────────────────────────────────────────────────── */

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

interface TourData {
  _id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  duration: string;
  description?: string;
  highlights: string[];
  includes: string[];
  departure?: string;
  category?: string;
  ratingAverage?: number;
  ratingCount?: number;
}

const BookTour = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tour, setTour] = useState<TourData | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    people: 1,
    note: "",
    date: "",
  });
  const [formError, setFormError] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 0, content: "" });
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Chưa đăng nhập!",
        description: "Vui lòng đăng nhập để đặt tour và đánh giá.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [navigate]);

  // Lấy thông tin tour
  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tours/${id}`);
        if (!res.ok) throw new Error("Không tìm thấy tour");
        const data = await res.json();
        setTour(data);
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err.message || "Không thể tải tour",
          variant: "destructive",
        });
        navigate("/tours");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTour();
  }, [id, navigate]);

  // LẤY ĐÁNH GIÁ CỦA TOUR + ĐÁNH GIÁ CỦA USER
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("token");
        const [allRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/reviews/tour/${id}`),
          token
            ? fetch(`${API_URL}/api/reviews/user/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : null,
        ]);

        if (allRes.ok) {
          const data = await allRes.json();
          setReviews(data);
        }

        if (userRes?.ok) {
          const userRev = await userRes.json();
          setUserReview(userRev);
          setNewReview({ rating: userRev.rating, content: userRev.content });
        }
      } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
      }
    };

    fetchReviews();
  }, [id]);

  // GỬI HOẶC CẬP NHẬT ĐÁNH GIÁ
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating === 0 || !newReview.content.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn số sao và viết nội dung đánh giá",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tourId: id,
          rating: newReview.rating,
          content: newReview.content.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gửi đánh giá thất bại");

      const updatedReview = result.review;

      setUserReview(updatedReview);
      setNewReview({
        rating: updatedReview.rating,
        content: updatedReview.content,
      });
      setIsEditing(false);

      setReviews((prev) => {
        const exists = prev.some((r) => r._id === updatedReview._id);
        return exists
          ? prev.map((r) => (r._id === updatedReview._id ? updatedReview : r))
          : [updatedReview, ...prev];
      });

      toast({
        title: "Thành công!",
        description: userReview
          ? "Cập nhật đánh giá thành công!"
          : "Gửi đánh giá thành công!",
      });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // XÓA ĐÁNH GIÁ
  const handleDeleteReview = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tourId: id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setUserReview(null);
      setNewReview({ rating: 0, content: "" });
      setReviews((prev) => prev.filter((r) => r._id !== userReview?._id));

      toast({
        title: "Đã xóa",
        description: "Đánh giá đã được xóa thành công",
      });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // ĐẶT TOUR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date || form.people < 1) {
      setFormError("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tour: tour?._id,
          bookingDate: form.date,
          people: form.people,
          note: form.note,
          name: form.name,
          phone: form.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đặt tour thất bại");

      toast({
        title: "Thành công!",
        description: "Đặt tour thành công! Chúng tôi sẽ liên hệ sớm.",
      });
      navigate("/my-bookings");
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  if (loading)
    return <div className="text-center py-32 text-xl">Đang tải tour...</div>;
  if (!tour)
    return (
      <div className="text-center py-32 text-xl text-red-500">
        Không tìm thấy tour!
      </div>
    );

  // TÍNH RATING TRUNG BÌNH
  const calculateRating = () => {
    if (!reviews || reviews.length === 0) {
      return { avg: "Chưa có", count: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / reviews.length).toFixed(1);
    return { avg, count: reviews.length };
  };

  const { avg: avgRating, count: reviewCount } = calculateRating();

  // Helper thời gian
  const timeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  };

  const exactDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // REVIEW CARD – HIỂN THỊ ẢNH GIỐNG HỆT TRANG TIN TỨC
  const ReviewCard = ({
    review,
    isUser,
  }: {
    review: Review;
    isUser: boolean;
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const displayName = review.user?.name || "Khách vãng lai";
    const initials = displayName.charAt(0).toUpperCase();

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
            {review.user?.avatar ? (
              <img
                src={getImageUrl(review.user.avatar)}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow">
                {initials}
              </div>
            )}
          </div>

          {/* Nội dung đánh giá */}
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
                    {exactDate(review.createdAt)}
                  </span>
                </div>
              </div>

              {/* Menu 3 chấm */}
              {isUser && !isEditing && (
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="hover:bg-indigo-100 rounded-full"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
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

            <p className="mt-4 text-gray-700 leading-relaxed">
              {review.content}
            </p>

            {/* PHẢN HỒI TỪ ADMIN – CÓ ẢNH THẬT (giống NewsDetail) */}
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
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
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
        <div className="container mx-auto px-4 max-w-7xl">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách tour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* CỘT TRÁI */}
            <div className="space-y-8">
              {tour.image && (
                <img
                  src={getImageUrl(tour.image)}
                  alt={tour.title}
                  className="w-full h-80 object-cover rounded-2xl shadow-lg"
                />
              )}
              <h1 className="text-4xl font-extrabold mt-6">{tour.title}</h1>

              <div className="flex items-center gap-3 mt-4 text-lg">
                <div className="flex items-center gap-1">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{avgRating}</span>
                </div>
                <span className="text-gray-600">({reviewCount} đánh giá)</span>
              </div>

              {tour.description && (
                <p className="mt-6 text-gray-700 leading-relaxed text-lg">
                  {tour.description}
                </p>
              )}

              {/* Điểm nổi bật & Bao gồm */}
              {tour.highlights?.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center gap-2">
                    <MapPin className="h-7 w-7" /> Điểm nổi bật
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tour.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 shadow-sm"
                      >
                        <div className="mt-1 w-3 h-3 bg-teal-500 rounded-full flex-shrink-0" />
                        <span className="text-gray-800 font-medium">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tour.includes?.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-2xl font-bold mb-6 text-green-700 flex items-center gap-2">
                    <svg
                      className="h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Bao gồm trong tour
                  </h3>
                  <div className="space-y-3">
                    {tour.includes.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm"
                      >
                        <svg
                          className="h-7 w-7 text-green-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        ></svg>
                        <span className="text-gray-800 font-medium">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PHẦN ĐÁNH GIÁ */}
              <div
                id="reviews-section"
                className="bg-white rounded-3xl shadow-xl p-8 border mt-12"
              >
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <MessageCircle className="w-8 h-8 text-indigo-600" />
                  Đánh giá & Bình luận
                </h2>

                {/* Form gửi/cập nhật đánh giá */}
                {(!userReview || isEditing) && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="mb-10 pb-10 border-b-2"
                  >
                    <div className="mb-6">
                      <p className="font-medium mb-3">Chọn số sao của bạn</p>
                      <div className="flex gap-2">
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
                      placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                      rows={5}
                      value={newReview.content}
                      onChange={(e) =>
                        setNewReview({ ...newReview, content: e.target.value })
                      }
                    />

                    <div className="flex gap-4 mt-6">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {submitting
                          ? "Đang gửi..."
                          : isEditing
                          ? "Cập nhật đánh giá"
                          : "Gửi đánh giá"}
                      </Button>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setNewReview({
                              rating: userReview!.rating,
                              content: userReview!.content,
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
                  {reviews.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 italic text-lg">
                      Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải
                      nghiệm!
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <ReviewCard
                        key={review._id}
                        review={review}
                        isUser={userReview?._id === review._id}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI - FORM ĐẶT TOUR */}
            <Card className="shadow-xl sticky top-6">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700">
                  Đặt Tour Ngay
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Họ tên</Label>
                      <div className="relative mt-1">
                        <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          className="pl-10"
                          placeholder="Nguyễn Văn A"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Số điện thoại</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          className="pl-10"
                          placeholder="0901234567"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ngày đi</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          type="date"
                          className="pl-10"
                          value={form.date}
                          onChange={(e) =>
                            setForm({ ...form, date: e.target.value })
                          }
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Số người</Label>
                      <div className="relative mt-1">
                        <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                          className="w-full h-10 pl-10 pr-3 border rounded-md focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                          value={form.people}
                          onChange={(e) =>
                            setForm({ ...form, people: +e.target.value })
                          }
                        >
                          {[...Array(20)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} người
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Ghi chú (tùy chọn)</Label>
                    <Input
                      className="mt-1"
                      placeholder="Yêu cầu đặc biệt, ăn chay, trẻ em..."
                      value={form.note}
                      onChange={(e) =>
                        setForm({ ...form, note: e.target.value })
                      }
                    />
                  </div>

                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Tổng tiền ({form.people} người):</span>
                      <span className="text-indigo-700">
                        {formatPrice(tour.price * form.people)}
                      </span>
                    </div>
                  </div>

                  {formError && (
                    <p className="text-red-500 text-sm text-center">
                      {formError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    Xác nhận đặt tour ngay
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookTour;
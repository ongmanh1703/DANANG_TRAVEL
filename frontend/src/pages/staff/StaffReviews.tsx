// src/pages/staff/StaffReviews.tsx
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, AlertCircle, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// ====== THÊM LOGO WEB (SỬA PATH CHO ĐÚNG DỰ ÁN CỦA BẠN) ======
import logo from '@/assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Review {
  _id: string;
  user: { name: string; avatar?: string };
  rating: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  targetTitle: string;
  targetType: 'Tour' | 'Bài viết';
  reply?: {
    content: string;
    admin: { name: string; avatar?: string };
    repliedAt: string;
  };
}

const StaffReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Chưa đăng nhập',
        description: 'Vui lòng đăng nhập lại',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('No token');

    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      toast({
        title: 'Phiên hết hạn',
        description: 'Đăng nhập lại',
        variant: 'destructive',
      });
      setTimeout(() => (window.location.href = '/login'), 1000);
      throw new Error('Unauthorized');
    }

    return res;
  };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiCall('/api/reviews/all');
      if (!res.ok) throw new Error((await res.json()).message || 'Lỗi tải dữ liệu');
      const data: Review[] = await res.json();
      setReviews(data);
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReply = async (reviewId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await apiCall(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Gửi phản hồi thất bại');
      const { reply } = await res.json();
      setReviews(prev => prev.map(r => (r._id === reviewId ? { ...r, reply } : r)));
      toast({ title: 'Đã gửi phản hồi!' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl">Đang tải đánh giá...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Quản lý Đánh giá</h1>
          <p className="text-muted-foreground mt-1">
            Nhân viên chỉ được PHẢN HỒI, không được xóa đánh giá
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-5 py-2">
          {reviews.length} đánh giá
        </Badge>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Chưa có đánh giá nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reviews.map(review => (
            <Card key={review._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  {/* Nội dung đánh giá */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold text-lg">
                        {review.user?.name || 'Khách vãng lai'}
                      </span>
                      <Badge
                        variant={review.targetType === 'Tour' ? 'default' : 'secondary'}
                      >
                        {review.targetType}
                      </Badge>
                      <Badge variant="outline" className="max-w-xs truncate">
                        {review.targetTitle}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">{renderStars(review.rating)}</div>
                      <span className="font-bold text-lg">{review.rating}.0</span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {review.content}
                    </p>

                    {/* PHẢN HỒI NHÂN VIÊN - HIỂN THỊ ĐÀ NẴNG TRAVEL + LOGO */}
                    {review.reply ? (
                      <div className="mt-6 ml-12 pl-6 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <img
                                src={logo}
                                alt="Đà Nẵng Travel"
                                className="w-9 h-9 rounded-full object-cover border"
                              />
                              <div>
                                <span className="font-bold text-emerald-800">
                                  Đà Nẵng Travel
                                </span>
                                <span className="text-xs text-gray-600 ml-3">
                                  {formatDate(review.reply.repliedAt)}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-800 pl-12 leading-relaxed">
                              {review.reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 ml-12">
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            const input = e.currentTarget.reply as HTMLInputElement;
                            const content = input.value.trim();
                            if (content) {
                              handleReply(review._id, content);
                              input.value = '';
                            }
                          }}
                          className="flex gap-3 items-center"
                        >
                          <input
                            name="reply"
                            type="text"
                            placeholder="Nhập phản hồi từ Đà Nẵng Travel..."
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                            onKeyDown={e => {
                              if (e.key === 'Enter')
                                e.currentTarget.form?.requestSubmit();
                            }}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Nhân viên không có nút xóa ở cột phải */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffReviews;

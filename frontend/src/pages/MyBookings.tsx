import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  User as UserIcon,
  Clock,
  X,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

const currencyVN = (n?: number) =>
  typeof n === "number" ? new Intl.NumberFormat("vi-VN").format(n) + "đ" : "-";

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "Chưa đăng nhập", description: "Vui lòng đăng nhập để xem đơn đặt tour" });
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không thể tải danh sách đơn");
        const data = await res.json();
        setBookings(data);
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [navigate]);

  const getDays = (b: any) =>
    b?.tour?.duration ?? b?.tour?.days ?? b?.tour?.durationDays ?? b?.duration ?? 1;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: { label: "Đã xác nhận", color: "emerald", icon: CheckCircle2 },
      pending: { label: "Đang xử lý", color: "amber", icon: AlertCircle },
      cancelled: { label: "Đã hủy", color: "red", icon: XCircle },
    } as const;

    return configs[status as keyof typeof configs] ?? {
      label: "Không rõ",
      color: "gray",
      icon: AlertCircle,
    };
  };

  const cancelBooking = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn này không?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Hủy đơn thất bại");

      // Cập nhật trạng thái thành cancelled (giữ lại để hiển thị nút Xóa)
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );

      toast({
        title: "Đã hủy đơn",
        description: "Bạn có thể xóa vĩnh viễn đơn này nếu muốn.",
      });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message });
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("XÓA VĨNH VIỄN đơn này? Bạn sẽ không thể khôi phục!")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      setBookings((prev) => prev.filter((b) => b._id !== id));
      toast({ title: "Đã xóa", description: "Đơn đã được xóa hoàn toàn" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message });
    }
  };

  // Loading & Empty State (giữ nguyên đẹp như cũ)
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-pulse shadow-2xl" />
            <p className="text-2xl font-light text-gray-700 animate-pulse">
              Đang tải những chuyến đi của bạn...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (bookings.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="relative mb-12">
              <div className="absolute inset-0 blur-3xl opacity-40">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full animate-pulse" />
              </div>
              <div className="relative">
                <div className="w-48 h-48 mx-auto bg-white rounded-full shadow-2xl flex items-center justify-center border-8 border-white">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-20 h-20 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-extralight text-gray-800 mb-6 leading-tight">
              Chưa có chuyến đi nào
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 font-light">
              Hành trình của bạn vẫn đang chờ được viết nên...
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Hãy để chúng tôi đưa bạn đến những vùng đất mới, những trải nghiệm đáng nhớ và những kỷ niệm không thể nào quên.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate("/tours")}
                className="relative px-12 py-8 text-lg font-medium rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 group-hover:animate-spin" />
                  Khám phá tour ngay bây giờ
                </span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="px-10 py-8 text-lg rounded-full border-2 border-purple-300 hover:bg-purple-50 backdrop-blur-sm"
              >
                Về trang chủ
              </Button>
            </div>

            <p className="mt-16 text-sm text-gray-500 italic font-light">
              "Du lịch không chỉ là đi, mà là sống thêm một lần nữa."
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8 text-gray-600 hover:text-indigo-600 hover:bg-white/80 backdrop-blur rounded-full"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Đơn đặt tour của bạn
            </h1>
            <p className="mt-4 text-lg text-gray-600">Quản lý và theo dõi các chuyến đi sắp tới</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {bookings.map((b) => {
              const total = (b.tour?.price || 0) * b.people;
              const days = getDays(b);
              const status = getStatusConfig(b.status);
              const StatusIcon = status.icon;

              return (
                <Card
                  key={b._id}
                  className="group relative overflow-hidden rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3"
                >
                  <div className={`h-2 bg-gradient-to-r 
                    ${b.status === 'confirmed' ? 'from-emerald-500 to-teal-600' : ''}
                    ${b.status === 'pending' ? 'from-amber-500 to-orange-600' : ''}
                    ${b.status === 'cancelled' ? 'from-red-500 to-rose-600' : 'from-gray-400 to-gray-600'}
                  `} />

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 line-clamp-2">
                        {b.tour?.title || "Tour không tên"}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`ml-3 border-${status.color}-300 text-${status.color}-700 bg-${status.color}-50 flex items-center gap-1`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-5 text-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-full"><UserIcon className="w-5 h-5 text-indigo-600" /></div>
                        <div><p className="text-sm text-gray-500">Người đặt</p><p className="font-semibold">{b.name}</p></div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-full"><Calendar className="w-5 h-5 text-purple-600" /></div>
                        <div><p className="text-sm text-gray-500">Ngày khởi hành</p><p className="font-semibold capitalize">{formatDate(b.bookingDate)}</p></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-pink-100 rounded-full"><Clock className="w-5 h-5 text-pink-600" /></div>
                          <div><p className="text-sm text-gray-500">Thời gian</p><p className="font-bold">{days} ngày</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-teal-100 rounded-full"><Users className="w-5 h-5 text-teal-600" /></div>
                          <div><p className="text-sm text-gray-500">Số người</p><p className="font-bold">{b.people} khách</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Giá mỗi người</span>
                        <span className="font-medium">{currencyVN(b.tour?.price)}</span>
                      </div>
                      <div className="mt-4 flex justify-between text-2xl font-bold">
                        <span className="text-gray-700">Tổng tiền</span>
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {currencyVN(total)}
                        </span>
                      </div>
                    </div>

                    {b.note && (
                      <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>Ghi chú: {b.note}</span>
                      </div>
                    )}

                    {/* PHẦN QUAN TRỌNG: NÚT HÀNH ĐỘNG */}
                    <div className="mt-8 flex flex-wrap gap-3 justify-end">
                      {/* Thanh toán */}
                      {b.status === "confirmed" && (
                        <Button
                          onClick={() => navigate(`/payment/${b._id}`)}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Thanh toán ngay
                        </Button>
                      )}

                      {/* Hủy đơn */}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <Button
                          variant="outline"
                          onClick={() => cancelBooking(b._id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="mr-2 h-4 w-4" /> Hủy đơn
                        </Button>
                      )}

                      {/* XÓA ĐƠN: HIỆN KHI PENDING HOẶC CANCELLED */}
                      {(b.status === "pending" || b.status === "cancelled") && (
                        <Button
                          variant="destructive"
                          onClick={() => deleteBooking(b._id)}
                          className="shadow-lg hover:shadow-xl"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {b.status === "cancelled" ? "Xóa vĩnh viễn" : "Xóa đơn"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyBookings;
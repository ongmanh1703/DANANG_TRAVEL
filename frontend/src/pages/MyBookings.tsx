import { useState, useEffect, useRef } from "react";
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

const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000;

const currencyVN = (n?: number) =>
  n ? new Intl.NumberFormat("vi-VN").format(n) + "đ" : "-";

const formatCountdown = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(
    Math.floor((ms % 60000) / 1000)
  ).padStart(2, "0")}`;

const getTimeLeftMs = (b: any, now: number) =>
  b.status === "confirmed" && b.createdAt
    ? Math.max(
        0,
        new Date(b.createdAt).getTime() + PAYMENT_TIMEOUT_MS - now
      )
    : null;

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const autoCancelRef = useRef<Set<string>>(new Set());

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch bookings
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để xem đơn đặt tour",
      });
      return navigate("/login");
    }

    fetch("http://localhost:5000/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject("Không thể tải đơn")))
      .then(setBookings)
      .catch((err) => toast({ title: "Lỗi", description: err.message || err }))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Auto cancel
  useEffect(() => {
    bookings.forEach((b) => {
      const left = getTimeLeftMs(b, now);
      if (
        b.status === "confirmed" &&
        left !== null &&
        left <= 0 &&
        !autoCancelRef.current.has(b._id)
      ) {
        autoCancelRef.current.add(b._id);
        fetch(`http://localhost:5000/api/bookings/${b._id}/cancel`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }).then(() => {
          setBookings((prev) => prev.filter((x) => x._id !== b._id));
          toast({
            title: "Đã tự động hủy",
            description: "Quá hạn thanh toán 10 phút",
          });
        });
      }
    });
  }, [now, bookings]);

  // Lấy duration (có thể là number hoặc string)
  const getDays = (b: any) =>
    b?.tour?.duration ?? b?.tour?.days ?? b?.duration ?? 1;

  const formatDuration = (b: any) => {
    const d = getDays(b);
    if (typeof d === "number") return `${d} ngày`;

    const s = String(d).trim();
    return /ngày/i.test(s) ? s : `${s} ngày`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatus = (s: string) =>
    (
      {
        confirmed: { label: "Chờ thanh toán", color: "yellow", icon: Clock },
        paid_pending: {
          label: "Chờ xác nhận",
          color: "orange",
          icon: AlertCircle,
        },
        paid: { label: "Đã thanh toán", color: "emerald", icon: CheckCircle2 },
        cancelled: { label: "Đã hủy", color: "red", icon: XCircle },
      } as any
    )[s] || { label: "Không rõ", color: "gray", icon: AlertCircle };

  const cancelBooking = async (id: string) => {
    if (!confirm("Hủy đơn này?")) return;
    try {
      await fetch(`http://localhost:5000/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      toast({ title: "Đã hủy đơn" });
    } catch {
      toast({ title: "Lỗi", description: "Hủy thất bại" });
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("XÓA VĨNH VIỄN?")) return;
    try {
      await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBookings((prev) => prev.filter((b) => b._id !== id));
      toast({ title: "Đã xóa vĩnh viễn" });
    } catch {
      toast({ title: "Lỗi xóa" });
    }
  };

  // Loading
  if (loading)
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse mb-6" />
            <p className="text-xl text-gray-700">Đang tải hành trình của bạn...</p>
          </div>
        </div>
        <Footer />
      </>
    );

  // Empty
  if (!bookings.length)
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 flex items-center justify-center py-20 px-6">
          <div className="text-center max-w-2xl">
            <MapPin className="w-32 h-32 mx-auto text-indigo-600 mb-8" />
            <h1 className="text-5xl font-extralight text-gray-800 mb-4">
              Chưa có chuyến đi nào
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Hành trình tuyệt vời đang chờ bạn khám phá
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/tours")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 rounded-full text-lg font-medium"
            >
              <Sparkles className="mr-2" /> Khám phá tour ngay
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );

  // Main
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8 rounded-full"
          >
            <ArrowLeft className="mr-2" /> Quay lại
          </Button>

          <h1 className="text-center text-5xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-12">
            Đơn đặt tour của bạn
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {bookings.map((b) => {
              const total = (b.tour?.price || 0) * b.people;
              const status = getStatus(b.status);
              const StatusIcon = status.icon;
              const timeLeft = getTimeLeftMs(b, now);
              const isExpired =
                b.status === "confirmed" && timeLeft !== null && timeLeft <= 0;
              const canPay = b.status === "confirmed" && !isExpired;

              return (
                <Card
                  key={b._id}
                  className="group relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                >
                  <div
                    className={`h-2 bg-gradient-to-r ${
                      b.status === "confirmed"
                        ? "from-yellow-400 to-amber-500"
                        : b.status === "paid_pending"
                        ? "from-orange-400 to-amber-500"
                        : b.status === "paid"
                        ? "from-emerald-500 to-teal-600"
                        : "from-red-500 to-rose-600"
                    }`}
                  />

                  <div className="p-7">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                        {b.tour?.title || "Tour không tên"}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`border-${status.color}-300 text-${status.color}-700 bg-${status.color}-50`}
                      >
                        <StatusIcon className="w-4 h-4 mr-1" /> {status.label}
                      </Badge>
                    </div>

                    {/* Countdown */}
                    {b.status === "confirmed" && timeLeft !== null && timeLeft > 0 && (
                      <div className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                        <p className="text-sm text-orange-700 font-medium">Còn lại</p>
                        <p className="text-3xl font-bold text-orange-600 font-mono">
                          {formatCountdown(timeLeft)}
                        </p>
                      </div>
                    )}

                    {isExpired && (
                      <div className="mb-5 p-4 bg-red-50 border border-red-300 rounded-xl text-center text-red-700 font-medium">
                        Đã hết hạn thanh toán
                      </div>
                    )}

                    {/* Info */}
                    <div className="space-y-4 text-gray-700 mb-6">
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span>{formatDate(b.bookingDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-pink-600" />
                          {/* ✅ FIX HERE */}
                          <span>{formatDuration(b)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-teal-600" />
                          <span>{b.people} khách</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                      <div className="flex justify-between text-2xl font-bold">
                        <span>Tổng</span>
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {currencyVN(total)}
                        </span>
                      </div>
                    </div>

                    {/* Trạng thái đặc biệt */}
                    {b.status === "paid" && (
                      <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-300 text-center">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
                        <p className="text-xl font-bold text-emerald-800">HOÀN TẤT</p>
                        <p className="text-sm text-emerald-700">Chuyến đi đã sẵn sàng!</p>
                      </div>
                    )}

                    {b.status === "paid_pending" && (
                      <div className="mt-6 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-300 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto text-orange-600 mb-2 animate-pulse" />
                        <p className="text-xl font-bold text-orange-800">CHỜ XÁC NHẬN</p>
                        <p className="text-sm text-orange-700">Đang kiểm tra thanh toán...</p>
                      </div>
                    )}

                    {b.status === "cancelled" && (
                      <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border-2 border-red-300 text-center">
                        <XCircle className="w-12 h-12 mx-auto text-red-600 mb-2" />
                        <p className="text-xl font-bold text-red-800">ĐÃ HỦY</p>
                        <p className="text-sm text-red-700">Đơn đã bị hủy</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-end">
                      {canPay && (
                        <Button
                          onClick={() => navigate(`/payment/${b._id}`)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
                        >
                          <CreditCard className="mr-2" /> Thanh toán ngay
                        </Button>
                      )}
                      {b.status === "confirmed" && !isExpired && (
                        <Button
                          variant="outline"
                          onClick={() => cancelBooking(b._id)}
                          className="border-red-400 text-red-600 hover:bg-red-50"
                        >
                          <X className="mr-2" /> Hủy đơn
                        </Button>
                      )}
                      {b.status === "cancelled" && (
                        <Button variant="destructive" onClick={() => deleteBooking(b._id)}>
                          <Trash2 className="mr-2" /> Xóa vĩnh viễn
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

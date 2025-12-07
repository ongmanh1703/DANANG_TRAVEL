import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Booking = {
  _id: string;
  tour?: {
    _id: string;
    title: string;
    price?: number;
    duration?: number;
    days?: number;
    durationDays?: number;
  };
  name: string;
  phone: string;
  bookingDate: string;
  people: number;
  note?: string;
  status: "confirmed" | "paid_pending" | "paid" | "cancelled";
  createdAt: string;
};

const currencyVN = (n?: number) =>
  typeof n === "number" ? new Intl.NumberFormat("vi-VN").format(n) + "đ" : "-";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN");

const getDays = (b: any) =>
  b?.tour?.duration ?? b?.tour?.days ?? b?.tour?.durationDays ?? 1;

export default function Payment() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get("payment"); // success | failed
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Lấy danh sách booking của user
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:5000/api/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Lỗi tải dữ liệu");
        setBookings(data);
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [navigate, toast]);

  const booking = useMemo(
    () => bookings.find((b) => b._id === bookingId),
    [bookings, bookingId]
  );

  const total = (booking?.people ?? 0) * (booking?.tour?.price ?? 0);

  // Cho phép thanh toán khi đơn đang confirmed (chờ thanh toán)
  const canPay = booking?.status === "confirmed";

  // Xem như đã thanh toán nếu status là paid hoặc paid_pending
  const isPaid =
    booking && (booking.status === "paid" || booking.status === "paid_pending");

  // ===== MO MO =====
  const handleMomoPayment = async () => {
    if (!booking || paying) return;
    if (!total || total <= 0) {
      toast({
        title: "Không thể thanh toán",
        description: "Tổng tiền không hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    setPaying(true);
    toast({
      title: "Đang chuyển đến MoMo...",
      description: "Vui lòng chờ...",
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/payments/momo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: total,
          bookingId: booking._id,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Lỗi tạo thanh toán MoMo");
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        throw new Error("Không nhận được payUrl từ MoMo");
      }
    } catch (err: any) {
      toast({
        title: "Lỗi thanh toán MoMo",
        description: err.message,
        variant: "destructive",
      });
      setPaying(false);
    }
  };

  // ===== VNPAY =====
  const handleVnpayPayment = async () => {
    if (!booking || paying) return;
    if (!total || total <= 0) {
      toast({
        title: "Không thể thanh toán",
        description: "Tổng tiền không hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    setPaying(true);
    toast({
      title: "Đang chuyển đến VNPAY...",
      description: "Vui lòng chờ...",
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/payments/vnpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: total,
          bookingId: booking._id,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message || "Không thể tạo thanh toán VNPAY"
        );
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Không nhận được paymentUrl từ VNPAY");
      }
    } catch (err: any) {
      toast({
        title: "Lỗi thanh toán VNPAY",
        description: err.message,
        variant: "destructive",
      });
      setPaying(false);
    }
  };

  // ===== UI KẾT QUẢ THANH TOÁN =====
  if (paymentResult === "success" || isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-green-100 rounded-full mb-8">
              <CheckCircle2 className="w-20 h-20 text-green-600" />
            </div>
            <h1 className="text-5xl font-bold text-green-700 mb-6">
              Thanh toán thành công!
            </h1>
            <p className="text-2xl text-gray-700 mb-4">
              Cảm ơn quý khách đã tin tưởng{" "}
              <strong className="text-pink-600">Danang Travel</strong>
            </p>
            <p className="text-xl text-gray-600 mb-10">
              Mã đơn hàng:{" "}
              <span className="font-bold text-pink-600 text-3xl">
                #{bookingId?.slice(-6).toUpperCase()}
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="text-lg px-12 py-6"
                onClick={() => navigate("/my-bookings")}
              >
                Xem chi tiết đơn hàng
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-12 py-6"
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </Button>
            </div>
            <p className="mt-10 text-gray-500 text-lg">
              Vé tour sẽ được gửi qua email trong vòng 5 phút
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (paymentResult === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Header />
        <main className="py-20 text-center">
          <XCircle className="w-32 h-32 mx-auto text-red-600 mb-8" />
          <h1 className="text-5xl font-bold text-red-700 mb-6">
            Thanh toán không thành công
          </h1>
          <p className="text-xl text-gray-700 mb-10">
            Quý khách vui lòng thử lại
          </p>
          <Button
            size="lg"
            onClick={() => navigate(`/payment/${bookingId}`)}
          >
            Thử thanh toán lại
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== UI ĐANG LOAD / LỖI =====
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Đang tải...
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen text-center py-20 text-2xl text-red-600">
        Không tìm thấy đơn hàng
      </div>
    );

  // ===== UI THANH TOÁN =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                      Thông tin đơn hàng
                    </h2>
                    <Badge
                      variant={
                        isPaid ? "default" : canPay ? "secondary" : "outline"
                      }
                    >
                      {isPaid
                        ? "Đã thanh toán"
                        : canPay
                        ? "Đã xác nhận"
                        : "Đang xử lý"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg">
                    {booking.tour?.title}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Ngày đi:{" "}
                      {formatDate(booking.bookingDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Thời gian:{" "}
                      {getDays(booking)} ngày
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> Số người:{" "}
                      {booking.people}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng tiền</span>
                      <span className="text-red-600">
                        {currencyVN(total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Thanh toán */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-center mb-8">
                    Phương thức thanh toán
                  </h2>
                  {!canPay ? (
                    <div className="text-center py-16 text-gray-600">
                      <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">
                        Đơn hàng chưa ở trạng thái cho phép thanh toán
                        online.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-10">
                      {/* MoMo */}
                      <div className="space-y-5">
                        <img
                          src="https://cdn.mservice.com.vn/img/momo-logo.png"
                          alt="MoMo"
                          className="h-16 mx-auto"
                        />
                        <p className="text-lg font-medium">
                          Thanh toán qua{" "}
                          <strong className="text-pink-600">
                            MoMo (Thẻ ATM)
                          </strong>
                        </p>
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl max-w-md mx-auto text-left text-sm font-medium">
                          <p>
                            • Số thẻ:{" "}
                            <code className="bg-white px-3 py-1 rounded">
                              9704 0000 0000 0018
                            </code>
                          </p>
                          <p>
                            • Ngày hết hạn:{" "}
                            <code className="bg-white px-3 py-1 rounded">
                              03/07
                            </code>
                          </p>
                          <p>
                            • OTP:{" "}
                            <span className="text-green-600 font-bold text-lg">
                              OTP
                            </span>{" "}
                            → Thành công ngay!
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={handleMomoPayment}
                          disabled={paying}
                          className="bg-pink-500 hover:bg-pink-600 text-white text-xl px-20 py-8 font-bold shadow-xl"
                        >
                          {paying
                            ? "Đang chuyển hướng..."
                            : `Thanh toán ${currencyVN(
                                total
                              )} qua MoMo`}
                        </Button>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span className="h-px w-16 bg-gray-300" />
                        <span>Hoặc</span>
                        <span className="h-px w-16 bg-gray-300" />
                      </div>

                      {/* VNPAY */}
                      <div className="space-y-5">
                        <img
                          src="https://vnpay.vn/assets/img/vnpay-logo.png"
                          alt="VNPAY"
                          className="h-10 mx-auto"
                        />
                        <p className="text-lg font-medium">
                          Thanh toán qua{" "}
                          <strong className="text-red-600">
                            VNPAY (ATM / Thẻ quốc tế / QR)
                          </strong>
                        </p>
                        <Button
                          size="lg"
                          onClick={handleVnpayPayment}
                          disabled={paying}
                          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-xl px-20 py-8 font-bold shadow-xl"
                        >
                          {paying
                            ? "Đang chuyển hướng..."
                            : `Thanh toán ${currencyVN(
                                total
                              )} qua VNPAY`}
                        </Button>
                      </div>

                      <p className="mt-4 text-sm text-gray-500">
                        Mã đơn (Booking):{" "}
                        <strong>
                          #{booking._id.slice(-6).toUpperCase()}
                        </strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

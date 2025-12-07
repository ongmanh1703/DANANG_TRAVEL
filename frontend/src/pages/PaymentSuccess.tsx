import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "N/A";
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const shortCode = bookingId === "N/A" ? "------" : bookingId.slice(-6).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-white/80 shadow-xl border border-emerald-100 backdrop-blur-lg p-8 sm:p-10">
            {/* Vòng tròn icon */}
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center space-y-6">
              <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 shadow-inner mb-4">
                <CheckCircle2 className="w-20 h-20 text-emerald-500" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-800">
                Thanh toán thành công!
              </h1>

              <p className="text-lg sm:text-xl text-gray-700 max-w-xl">
                Cảm ơn quý khách đã tin tưởng{" "}
                <span className="font-bold text-pink-600">Danang Travel</span>. 
                Đơn đặt tour của bạn đã được ghi nhận.
              </p>

              {/* Mã đơn + trạng thái */}
              <div className="mt-4 w-full max-w-md">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-emerald-100/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-left">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-700">
                      Mã đơn hàng
                    </p>
                    <p className="text-3xl font-extrabold text-pink-600">
                      #{shortCode}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-700">
                      Trạng thái
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-white/80 rounded-full px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Đã thanh toán
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin thêm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 w-full max-w-2xl text-sm text-gray-600">
                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <p className="font-semibold text-gray-800 mb-1">Xác nhận qua email</p>
                  <p>Vé tour và thông tin chi tiết sẽ được gửi trong vòng 5 phút.</p>
                </div>
                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <p className="font-semibold text-gray-800 mb-1">Tài khoản của bạn</p>
                  <p>Có thể xem lại đơn hàng trong mục “Đơn hàng của tôi”.</p>
                </div>
                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <p className="font-semibold text-gray-800 mb-1">Hỗ trợ nhanh</p>
                  <p>Liên hệ CSKH nếu bạn chưa nhận được email xác nhận.</p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center w-full">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-10 py-6 rounded-2xl"
                  onClick={() => navigate("/my-bookings")}
                >
                  Xem đơn hàng của tôi
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-10 py-6 rounded-2xl border-gray-300"
                  onClick={() => navigate("/")}
                >
                  Về trang chủ
                </Button>
              </div>

              {/* Countdown */}
              <p className="mt-4 text-sm text-gray-500">
                Tự động chuyển về trang chủ sau{" "}
                <span className="font-semibold text-emerald-700">{countdown}s</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

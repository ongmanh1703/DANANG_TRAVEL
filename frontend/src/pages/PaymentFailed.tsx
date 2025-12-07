import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, PhoneCall } from "lucide-react";

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();

  const shortCode = bookingId ? bookingId.slice(-6).toUpperCase() : null;

  const handleRetry = () => {
    if (bookingId) {
      navigate(`/payment/${bookingId}`);
    } else {
      navigate("/my-bookings");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-white/85 shadow-xl border border-rose-100 backdrop-blur-lg p-8 sm:p-10">
            {/* Hiệu ứng nền */}
            <div className="absolute -top-24 -left-16 w-52 h-52 bg-rose-100/70 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-16 w-60 h-60 bg-orange-100/70 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center space-y-6">
              <div className="w-28 h-28 flex items-center justify-center rounded-full bg-rose-50 shadow-inner mb-4">
                <XCircle className="w-20 h-20 text-rose-500" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-rose-800">
                Thanh toán không thành công
              </h1>

              <p className="text-base sm:text-lg text-gray-700 max-w-xl">
                Rất tiếc, giao dịch của bạn chưa được hoàn tất. 
                Đừng lo, bạn có thể thử lại hoặc liên hệ để được hỗ trợ.
              </p>

              {/* Mã đơn & trạng thái */}
              <div className="mt-4 w-full max-w-md">
                <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-left">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-rose-700">
                      Mã đơn hàng
                    </p>
                    <p className="text-2xl font-extrabold text-rose-600">
                      {shortCode ? `#${shortCode}` : "Không xác định"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-rose-700">
                      Trạng thái
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 bg-white/80 rounded-full px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Thanh toán thất bại
                    </p>
                  </div>
                </div>
              </div>

              {/* Gợi ý nguyên nhân & cách xử lý */}
              <div className="mt-6 w-full max-w-2xl text-left">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Một số nguyên nhân thường gặp:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                    • Thẻ hết hạn hoặc không đủ số dư  
                    <br />• Nhập sai thông tin thẻ / OTP
                  </div>
                  <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                    • Ngân hàng chặn giao dịch online  
                    <br />• Kết nối mạng không ổn định
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center w-full">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-10 py-6 rounded-2xl"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 w-5 h-5" />
                  Thử thanh toán lại
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-10 py-6 rounded-2xl border-gray-300"
                  onClick={() => navigate("/my-bookings")}
                >
                  Về danh sách đơn hàng
                </Button>
              </div>

              {/* Hỗ trợ */}
              <div className="mt-4 text-sm text-gray-600 flex flex-col items-center gap-1">
                <p>Nếu vẫn không thực hiện được thanh toán, vui lòng liên hệ hỗ trợ:</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-rose-700 font-medium hover:underline"
                  onClick={() => window.open("tel:0123456789")}
                >
                  <PhoneCall className="w-4 h-4" />
                  Hotline CSKH: 0123 456 789
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

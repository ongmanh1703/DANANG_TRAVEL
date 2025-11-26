import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Calendar as CalendarIcon,
  Users,
  Banknote,
  Copy,
  Smartphone,
  Clock, // ⬅️ icon số ngày
} from "lucide-react";

type Booking = {
  _id: string;
  tour?: { _id: string; title: string; price?: number; duration?: number; days?: number; durationDays?: number };
  user?: { _id: string; name?: string };
  name: string;
  phone: string;
  bookingDate: string; // ISO
  people: number;
  note?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  duration?: number; // fallback
};

const currencyVN = (n?: number) =>
  typeof n === "number" ? new Intl.NumberFormat("vi-VN").format(n) + "đ" : "-";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const getDays = (b: any) =>
  b?.tour?.duration ?? b?.tour?.days ?? b?.tour?.durationDays ?? b?.duration ?? 1;

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeMethod, setActiveMethod] = useState<"card" | "bank" | "ewallet">("card");

  // Form thẻ
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Lấy danh sách booking của chính user, rồi tìm booking theo id
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({ title: "Chưa đăng nhập!", description: "Vui lòng đăng nhập để thanh toán." });
          navigate("/login");
          return;
        }
        const res = await fetch("http://localhost:5000/api/bookings", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải booking");
        }
        setBookings(data);
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message });
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

  const pricePer = booking?.tour?.price ?? 0;
  const total = (booking?.people ?? 0) * pricePer;
  const canPay = booking?.status === "confirmed";
  const days = getDays(booking);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Đã sao chép", description: `${label} đã được copy.` });
    } catch {
      toast({ title: "Copy thất bại", description: "Vui lòng copy thủ công." });
    }
  };

  const handlePay = async () => {
    if (!booking) return;
    if (!canPay) {
      toast({ title: "Không thể thanh toán", description: "Đơn chưa được xác nhận." });
      return;
    }

    // Validate theo phương thức
    if (activeMethod === "card") {
      if (!cardName || !cardNumber || !cardExp || !cardCvv) {
        toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ thông tin thẻ." });
        return;
      }
      if (cardNumber.replace(/\s/g, "").length < 12) {
        toast({ title: "Số thẻ chưa hợp lệ", description: "Vui lòng kiểm tra lại số thẻ." });
        return;
      }
    }

    try {
      // TODO: call real payment API ở đây nếu có
      // ví dụ: POST /api/payments/checkout { bookingId, method, amount }
      toast({
        title: "Thanh toán thành công",
        description: `Đã thanh toán ${currencyVN(total)} cho ${booking?.tour?.title}.`,
      });
      navigate("/my-bookings");
    } catch (err: any) {
      toast({ title: "Thanh toán thất bại", description: err.message || "Có lỗi xảy ra." });
    }
  };

  if (loading) return <div className="text-center py-20">Đang tải…</div>;
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-30">
          <div className="container mx-auto px-4 max-w-3xl">
            <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>
            <Card>
              <CardContent className="p-8 text-center">Không tìm thấy booking.</CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tóm tắt đơn */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Tóm tắt đơn</h2>
                    <Badge
                      className={
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {booking.status === "confirmed"
                        ? "Đã xác nhận"
                        : booking.status === "pending"
                        ? "Đang xử lý"
                        : "Đã hủy"}
                    </Badge>
                  </div>

                  <div>
                    <div className="font-semibold">{booking.tour?.title}</div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Ngày đi: {formatDate(booking.bookingDate)}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{days} </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{booking.people} người</span>
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      Khách đặt: {booking.name || booking.user?.name || "—"}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Ghi chú: {booking.note || "(Không có)"}
                    </div>
                  </div>

                  <div className="rounded-md bg-white/70 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Giá / người</span>
                      <span className="font-semibold">{currencyVN(pricePer)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-base">
                      <span className="font-semibold">Tổng cộng</span>
                      <span className="font-extrabold text-indigo-700">{currencyVN(total)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    Thanh toán an toàn – dữ liệu được mã hóa.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Khu vực thanh toán */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>

                  <Tabs
                    defaultValue="card"
                    value={activeMethod}
                    onValueChange={(v) => setActiveMethod(v as any)}
                  >
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="card" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Thẻ
                      </TabsTrigger>
                      <TabsTrigger value="bank" className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" /> Chuyển khoản
                      </TabsTrigger>
                      <TabsTrigger value="ewallet" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> Ví điện tử
                      </TabsTrigger>
                    </TabsList>

                    {/* THẺ */}
                    <TabsContent value="card" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tên chủ thẻ</Label>
                          <Input
                            placeholder="VD: NGUYEN VAN A"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Số thẻ</Label>
                          <Input
                            inputMode="numeric"
                            maxLength={19}
                            placeholder="XXXX XXXX XXXX XXXX"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(
                                e.target.value
                                  .replace(/[^\d]/g, "")
                                  .replace(/(.{4})/g, "$1 ")
                                  .trim()
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hết hạn (MM/YY)</Label>
                          <Input
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardExp}
                            onChange={(e) =>
                              setCardExp(
                                e.target.value
                                  .replace(/[^\d]/g, "")
                                  .replace(/(\d{2})(\d{1,2})?/, (_, m, y) => (y ? `${m}/${y}` : m))
                                  .slice(0, 5)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="***"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* CHUYỂN KHOẢN */}
                    <TabsContent value="bank" className="mt-6">
                      <div className="rounded-md border p-4 bg-muted/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Ngân hàng</div>
                            <div className="font-semibold">Vietcombank – CN Đà Nẵng</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copy("Vietcombank - CN Da Nang", "Tên ngân hàng")}
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Số tài khoản</div>
                            <div className="font-semibold text-lg">0123456789</div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => copy("0123456789", "Số tài khoản")}>
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Chủ tài khoản</div>
                            <div className="font-semibold">CONG TY DU LICH DANANG</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copy("CONG TY DU LICH DANANG", "Chủ tài khoản")}
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Nội dung chuyển khoản</div>
                            <div className="font-semibold">
                              TT {booking._id.slice(-6)} {booking.name?.toUpperCase() || "GUEST"}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copy(
                                `TT ${booking._id.slice(-6)} ${booking.name?.toUpperCase() || "GUEST"}`,
                                "Nội dung chuyển khoản"
                              )
                            }
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                        </div>

                        <div className="text-sm text-gray-600">
                          Vui lòng chuyển đúng số tiền: <b>{currencyVN(total)}</b>. Sau khi nhận được, hệ thống sẽ
                          đối soát và xác nhận.
                        </div>
                      </div>
                    </TabsContent>

                    {/* VÍ ĐIỆN TỬ */}
                    <TabsContent value="ewallet" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="font-semibold mb-2">MoMo</div>
                            <div className="text-sm text-gray-600">
                              SĐT nhận: <b>0909 000 000</b>
                            </div>
                            <div className="text-sm text-gray-600">
                              Ghi chú: <b>TT {booking._id.slice(-6)}</b>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="font-semibold mb-2">ZaloPay</div>
                            <div className="text-sm text-gray-600">
                              SĐT nhận: <b>0911 111 111</b>
                            </div>
                            <div className="text-sm text-gray-600">
                              Ghi chú: <b>TT {booking._id.slice(-6)}</b>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Bạn đang thanh toán cho đơn <b>#{booking._id.slice(-6)}</b>
                    </div>
                    <Button
                      onClick={handlePay}
                      disabled={!canPay}
                      className={`px-6 ${
                        canPay
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300"
                      }`}
                      title={canPay ? "Tiến hành thanh toán" : "Đơn chưa xác nhận – không thể thanh toán"}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Thanh toán {currencyVN(total)}
                    </Button>
                  </div>
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

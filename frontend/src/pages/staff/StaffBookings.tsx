// src/pages/staff/StaffBookings.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  X,
  Eye,
  RefreshCcw,
  Search,
  Calendar as CalendarIcon,
  User as UserIcon,
  Phone,
  Clock,
  CheckCircle2,
  Mail,
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
  user?: { _id: string; name?: string; email?: string };
  name: string;
  phone: string;
  email?: string;
  bookingDate: string;
  people: number;
  note?: string;
  status: "confirmed" | "paid_pending" | "paid" | "cancelled";
  createdAt: string;
  duration?: number;
};

const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000;

const statusConfig = {
  confirmed: {
    label: "CHỜ THANH TOÁN (10 phút)",
    color: "bg-yellow-100 text-yellow-800",
  },
  paid_pending: {
    label: "ĐÃ THANH TOÁN – CHỜ DUYỆT",
    color: "bg-orange-100 text-orange-800",
  },
  paid: {
    label: "ĐÃ THANH TOÁN – HOÀN TẤT",
    color: "bg-emerald-100 text-emerald-800",
  },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
} as const;

const getStatus = (status: string) => {
  return (
    statusConfig[status as keyof typeof statusConfig] || {
      label: "Không rõ",
      color: "bg-gray-100 text-gray-700",
    }
  );
};

const currencyVN = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN").format(n) + "đ"
    : "-";

const fmtDate = (d?: string) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDays = (b: Booking) =>
  b.tour?.duration ??
  b.tour?.days ??
  b.tour?.durationDays ??
  b.duration ??
  1;

const isConfirmedExpired = (b: Booking) => {
  if (b.status !== "confirmed") return false;
  const created = new Date(b.createdAt).getTime();
  const now = Date.now();
  return now - created > PAYMENT_TIMEOUT_MS;
};

export default function StaffBookings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Booking["status"]>("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const token = localStorage.getItem("token");

const fetchAll = async (showLoading = true) => {
  if (showLoading) setLoading(true);
  try {
    const res = await fetch("http://localhost:5000/api/bookings/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Không thể tải danh sách");
    }
    const data = await res.json();
    setBookings(data);
  } catch (err: any) {
    if (showLoading) {
      toast({ title: "Lỗi tải dữ liệu", description: err.message });
    }
  } finally {
    if (showLoading) setLoading(false);
  }
};

  useEffect(() => {
    fetchAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAll(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (isConfirmedExpired(b)) return false;

      const matchesText =
        !q ||
        [b.tour?.title, b.name, b.phone, b.note, b.user?.name, b.user?.email, b.email]
          .filter(Boolean)
          .some((t) => t!.toString().toLowerCase().includes(q));
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [bookings, query, statusFilter]);

  // ===== GỬI HÓA ĐƠN TOUR QUA EMAIL (NHẤN TAY) =====
  const sendInvoice = async (id: string) => {
    if (
      !confirm(
        "Gửi hóa đơn tour qua email cho khách hàng?\n\nĐảm bảo đơn đã thanh toán (paid)."
      )
    )
      return;

    setBusyId(id);
    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings/${id}/send-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gửi hóa đơn thất bại");
      }

      toast({
        title: "Đã gửi hóa đơn",
        description: data.message || "Hóa đơn tour đã được gửi qua email.",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi gửi hóa đơn",
        description: err.message || "Không thể gửi hóa đơn.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  // ===== GỬI HÓA ĐƠN TỰ ĐỘNG KHI DUYỆT =====
  const sendInvoiceAuto = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings/${id}/send-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gửi hóa đơn thất bại");
      }

      toast({
        title: "Đã gửi hóa đơn",
        description:
          data.message || "Hóa đơn tour đã được gửi qua email cho khách.",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi gửi hóa đơn",
        description: err.message || "Không thể gửi hóa đơn tự động.",
        variant: "destructive",
      });
    }
  };

  // XÁC NHẬN THANH TOÁN (paid_pending → paid) + GỬI HÓA ĐƠN
  const confirmPayment = async (id: string) => {
    if (
      !confirm(
        "Xác nhận khách đã THANH TOÁN và chuyển trạng thái thành HOÀN TẤT?\n\nHệ thống sẽ tự động gửi hóa đơn tour qua email cho khách."
      )
    )
      return;

    setBusyId(id);
    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings/${id}/confirm-payment`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Cập nhật thất bại");

      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "paid" } : b))
      );

      toast({
        title: "Thành công!",
        description: "Đã xác nhận thanh toán hoàn tất.",
      });

      // gửi hóa đơn tự động
      await sendInvoiceAuto(id);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Cập nhật thất bại" });
    } finally {
      setBusyId(null);
    }
  };

  // HỦY ĐƠN (NHÂN VIÊN ĐƯỢC PHÉP)
  const cancelBooking = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings/${id}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Hủy đơn thất bại");
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      toast({ title: "Đã hủy", description: "Đơn đã được hủy" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header + Nút tải lại + Tự động */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý đặt tour (Nhân viên)
          </h1>
          <p className="text-muted-foreground mt-1">
            Tự động cập nhật khi khách thanh toán xong (đơn chờ thanh toán quá
            10 phút sẽ tự ẩn)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchAll(true)}
            disabled={loading}
            variant="outline"
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Tải lại ngay
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Tự động (10s)" : "Bật tự động"}
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm tour, tên khách, SĐT, email, ghi chú..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "" as const,
              "confirmed",
              "paid_pending",
              "paid",
              "cancelled",
            ] as const
          ).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s === "" ? "" : s)}
            >
              {s === "" ? "Tất cả" : getStatus(s).label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bảng danh sách */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã đơn</th>
                  <th className="px-6 py-4 font-medium">Tour</th>
                  <th className="px-6 py-4 font-medium">Khách hàng</th>
                  <th className="px-6 py-4 font-medium">Liên hệ</th>
                  <th className="px-6 py-4 font-medium">Ngày đi</th>
                  <th className="px-6 py-4 text-center font-medium">SL</th>
                  <th className="px-6 py-4 text-right font-medium">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <RefreshCcw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-3 text-muted-foreground">
                        Đang tải danh sách...
                      </p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-16 text-muted-foreground text-lg"
                    >
                      Không tìm thấy đơn đặt tour nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const days = getDays(b);
                    const total = (b.tour?.price || 0) * b.people;
                    const emailDisplay = b.user?.email || b.email;
                    return (
                      <tr
                        key={b._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-indigo-600">
                            #{b._id.slice(-6).toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {fmtDate(b.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium max-w-xs truncate">
                            {b.tour?.title || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            {days} ngày
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {b.name || b.user?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{b.phone}</span>
                            </div>
                            {emailDisplay && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                <span>{emailDisplay}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {fmtDate(b.bookingDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">
                          {b.people}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600">
                          {currencyVN(total)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatus(b.status).color}>
                            {getStatus(b.status).label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetail(b)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* NÚT GỬI HÓA ĐƠN – CHỈ KHI ĐÃ PAID (GỬI LẠI) */}
                            {b.status === "paid" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busyId === b._id}
                                onClick={() => sendInvoice(b._id)}
                                className="text-indigo-600 hover:bg-indigo-50"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}

                            {/* CHỈ HIỆN KHI ĐÃ THANH TOÁN CHỜ DUYỆT */}
                            {b.status === "paid_pending" && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={busyId === b._id}
                                onClick={() => confirmPayment(b._id)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}

                            {/* NHÂN VIÊN CHỈ ĐƯỢC HỦY, KHÔNG ĐƯỢC XÓA VĨNH VIỄN */}
                            {b.status !== "cancelled" && b.status !== "paid" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busyId === b._id}
                                onClick={() => cancelBooking(b._id)}
                                className="text-orange-600 hover:bg-orange-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal chi tiết */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">
                  Chi tiết đơn #{detail._id.slice(-6).toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      getStatus(detail.status).color +
                      " text-sm px-4 py-2 font-medium"
                    }
                  >
                    {getStatus(detail.status).label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetail(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Thông tin tour
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Tên tour:</strong> {detail.tour?.title || "—"}
                    </p>
                    <p>
                      <strong>Giá / người:</strong>{" "}
                      {currencyVN(detail.tour?.price)}
                    </p>
                    <p>
                      <strong>Số ngày:</strong> {getDays(detail)} ngày
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 pt-3 border-t">
                      Tổng tiền:{" "}
                      {currencyVN(
                        (detail.tour?.price || 0) * detail.people
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Khách hàng
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Họ tên:</strong> {detail.name}
                    </p>
                    <p>
                      <strong>Số điện thoại:</strong> {detail.phone}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {detail.user?.email || detail.email || "Không có"}
                    </p>
                    <p>
                      <strong>Tài khoản:</strong>{" "}
                      {detail.user?.name || "Khách vãng lai"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Thông tin đặt tour
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Ngày khởi hành:</strong>{" "}
                      {fmtDate(detail.bookingDate)}
                    </p>
                    <p>
                      <strong>Số người:</strong> {detail.people} người
                    </p>
                    <p>
                      <strong>Ngày tạo đơn:</strong>{" "}
                      {fmtDate(detail.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Ghi chú khách hàng
                  </h3>
                  <div className="p-5 bg-gray-50 rounded-xl border min-h-32 text-sm">
                    <p className="whitespace-pre-wrap">
                      {detail.note || "Không có ghi chú"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                {/* GỬI HÓA ĐƠN TRONG MODAL NẾU ĐÃ PAID (GỬI LẠI) */}
                {detail.status === "paid" && (
                  <Button
                    onClick={() => sendInvoice(detail._id)}
                    disabled={busyId === detail._id}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Gửi hóa đơn tour
                  </Button>
                )}

                {detail.status === "paid_pending" && (
                  <Button
                    onClick={() => confirmPayment(detail._id)}
                    disabled={busyId === detail._id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Xác nhận đã nhận tiền
                  </Button>
                )}
                {detail.status !== "cancelled" && detail.status !== "paid" && (
                  <Button
                    variant="outline"
                    onClick={() => cancelBooking(detail._id)}
                    disabled={busyId === detail._id}
                    className="border-orange-300 text-orange-600"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Hủy đơn
                  </Button>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
}

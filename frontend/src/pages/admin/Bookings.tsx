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
  Check,
  X,
  Eye,
  RefreshCcw,
  Search,
  Calendar as CalendarIcon,
  User as UserIcon,
  Phone,
  Users,
  Clock,
  Trash2,
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
  user?: { _id: string; name?: string };
  name: string;
  phone: string;
  bookingDate: string;
  people: number;
  note?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  duration?: number;
};

const statusConfig = {
  pending: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
} as const;

const currencyVN = (n?: number) =>
  typeof n === "number" ? new Intl.NumberFormat("vi-VN").format(n) + "đ" : "-";

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
  b.tour?.duration ?? b.tour?.days ?? b.tour?.durationDays ?? b.duration ?? 1;

export default function Bookings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Booking["status"]>("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    setLoading(true);
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
      toast({ title: "Lỗi tải dữ liệu", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesText =
        !q ||
        [b.tour?.title, b.name, b.phone, b.note, b.user?.name]
          .filter(Boolean)
          .some((t) => t!.toString().toLowerCase().includes(q));
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [bookings, query, statusFilter]);

  const updateStatus = async (id: string, status: Booking["status"]) => {
    setBusyId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status } : b))
      );
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const cancelBooking = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const deleteBooking = async (id: string) => {
    if (
      !confirm(
        "⚠️ XÓA VĨNH VIỄN đơn này?\n\nHành động này KHÔNG THỂ HOÀN TÁC!"
      )
    )
      return;

    setBusyId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      setBookings((prev) => prev.filter((b) => b._id !== id));
      toast({ title: "Đã xóa", description: "Đơn đã bị xóa vĩnh viễn" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đặt tour</h1>
          <p className="text-muted-foreground mt-1">
            Xem, xác nhận, hủy hoặc xóa vĩnh viễn các đơn đặt tour
          </p>
        </div>
        <Button onClick={fetchAll} disabled={loading} variant="outline">
          <RefreshCcw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Tải lại
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm tour, tên khách, SĐT, ghi chú..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["" as const, "pending", "confirmed", "cancelled"] as const).map(
            (s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "" ? "Tất cả" : statusConfig[s].label}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Table */}
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
                  <th className="px-6 py-4 text-right font-medium">Tổng tiền</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <RefreshCcw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-3 text-muted-foreground">Đang tải danh sách...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-muted-foreground text-lg">
                      Không tìm thấy đơn đặt tour nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const days = getDays(b);
                    const total = (b.tour?.price || 0) * b.people;

                    return (
                      <tr key={b._id} className="hover:bg-muted/50 transition-colors">
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
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {b.phone}
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
                          <Badge className={statusConfig[b.status].color}>
                            {statusConfig[b.status].label}
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

                            {b.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busyId === b._id}
                                onClick={() => updateStatus(b._id, "confirmed")}
                                className="text-green-600 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}

                            {b.status !== "cancelled" && (
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

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busyId === b._id}
                              onClick={() => deleteBooking(b._id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      {/* Modal Chi Tiết */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">
                  Chi tiết đơn #{detail._id.slice(-6).toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge className={statusConfig[detail.status].color + " text-sm px-3 py-1"}>
                    {statusConfig[detail.status].label}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tour Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">Thông tin tour</h3>
                  <div className="space-y-2">
                    <p><strong>Tên tour:</strong> {detail.tour?.title || "—"}</p>
                    <p><strong>Giá / người:</strong> {currencyVN(detail.tour?.price)}</p>
                    <p><strong>Số ngày:</strong> {getDays(detail)} ngày</p>
                    <p className="text-xl font-bold text-indigo-600 pt-2">
                      Tổng tiền: {currencyVN((detail.tour?.price || 0) * detail.people)}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">Khách hàng</h3>
                  <div className="space-y-2">
                    <p><strong>Họ tên:</strong> {detail.name}</p>
                    <p><strong>Số điện thoại:</strong> {detail.phone}</p>
                    <p><strong>Tài khoản:</strong> {detail.user?.name || "Khách vãng lai"}</p>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">Thông tin đặt tour</h3>
                  <div className="space-y-2">
                    <p><strong>Ngày khởi hành:</strong> {fmtDate(detail.bookingDate)}</p>
                    <p><strong>Số người:</strong> {detail.people} người</p>
                    <p><strong>Ngày tạo đơn:</strong> {fmtDate(detail.createdAt)}</p>
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">Ghi chú khách hàng</h3>
                  <div className="p-4 bg-muted/50 rounded-lg min-h-32 border">
                    <p className="whitespace-pre-wrap text-sm">
                      {detail.note || "Không có ghi chú"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                {detail.status === "pending" && (
                  <Button
                    onClick={() => updateStatus(detail._id, "confirmed")}
                    disabled={busyId === detail._id}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Xác nhận đơn
                  </Button>
                )}

                {detail.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    onClick={() => cancelBooking(detail._id)}
                    disabled={busyId === detail._id}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy đơn
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() => deleteBooking(detail._id)}
                  disabled={busyId === detail._id}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa vĩnh viễn
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
}
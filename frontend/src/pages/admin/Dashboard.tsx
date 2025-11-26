import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  MapPin,
  Compass,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";

const API_BASE = "http://localhost:5000/api";

interface Stats {
  totalUsers: number;
  totalTours: number;
  totalBookings: number;
  totalReviews: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTours: 0,
    totalBookings: 0,
    totalReviews: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [monthlyUsers, setMonthlyUsers] = useState<any[]>([]);
  const [tourDistribution, setTourDistribution] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Helper fetch với auth
  const fetchWithAuth = async (url: string) => {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Lỗi tải dữ liệu");
    return res.json();
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Lấy tất cả dữ liệu cần thiết song song
        const [users, tours, bookings, reviews] = await Promise.all([
          fetchWithAuth("/users"),
          fetchWithAuth("/tours"),
          fetchWithAuth("/bookings/all"),
          fetchWithAuth("/reviews/all"),
        ]);

        // Thống kê cơ bản
        const totalUsers = users.users?.length || 0;
        const totalTours = tours.length || 0;
        const totalBookings = bookings.length || 0;
        const totalReviews = reviews.length || 0;

        // Doanh thu & người dùng theo tháng
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));

        const revenueThisMonth = bookings
          .filter(
            (b: any) =>
              b.status === "confirmed" &&
              new Date(b.bookingDate) >= thisMonthStart
          )
          .reduce(
            (sum: number, b: any) => sum + (b.tour?.price || 0) * b.people,
            0
          );

        const revenueLastMonth = bookings
          .filter(
            (b: any) =>
              b.status === "confirmed" &&
              new Date(b.bookingDate) >= lastMonthStart &&
              new Date(b.bookingDate) < thisMonthStart
          )
          .reduce(
            (sum: number, b: any) => sum + (b.tour?.price || 0) * b.people,
            0
          );

        const newUsersThisMonth =
          users.users?.filter(
            (u: any) => new Date(u.createdAt) >= thisMonthStart
          ).length || 0;
        const newUsersLastMonth =
          users.users?.filter(
            (u: any) =>
              new Date(u.createdAt) >= lastMonthStart &&
              new Date(u.createdAt) < thisMonthStart
          ).length || 0;

        setStats({
          totalUsers,
          totalTours,
          totalBookings,
          totalReviews,
          revenueThisMonth,
          revenueLastMonth,
          newUsersThisMonth,
          newUsersLastMonth,
        });

        // Biểu đồ doanh thu 7 tháng gần nhất
        const last7Months = Array.from({ length: 7 }, (_, i) => {
          const date = subMonths(now, 6 - i);
          return {
            month: format(date, "MMM"),
            start: startOfMonth(date),
            end: i === 6 ? now : startOfMonth(subMonths(now, 5 - i)),
          };
        });

        const revenueData = last7Months.map(({ month, start, end }) => ({
          month,
          revenue: bookings
            .filter(
              (b: any) =>
                b.status === "confirmed" &&
                new Date(b.bookingDate) >= start &&
                new Date(b.bookingDate) < end
            )
            .reduce(
              (sum: number, b: any) => sum + (b.tour?.price || 0) * b.people,
              0
            ),
        }));
        setMonthlyRevenue(revenueData);

        // Tăng trưởng người dùng
        const userGrowthData = last7Months.map(({ month, start, end }) => ({
          month,
          users:
            users.users?.filter(
              (u: any) =>
                new Date(u.createdAt) >= start && new Date(u.createdAt) < end
            ).length || 0,
        }));
        setMonthlyUsers(userGrowthData);

        // Phân bố tour (dựa trên category hoặc departure)
        const categoryCount: Record<string, number> = {};
        tours.forEach((t: any) => {
          const key = t.category || t.departure || "Khác";
          categoryCount[key] = (categoryCount[key] || 0) + 1;
        });

        const distribution = Object.entries(categoryCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        if (distribution.length < 5) {
          distribution.push({
            name: "Khác",
            value: totalTours - distribution.reduce((s, i) => s + i.value, 0),
          });
        }
        setTourDistribution(distribution);

        // Hoạt động gần đây (10 booking mới nhất)
        const recent = bookings
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10)
          .map((b: any) => ({
            id: b._id.slice(-6),
            name: b.name || b.user?.name || "Khách",
            tour: b.tour?.title || "Không rõ",
            time: new Date(b.createdAt).toLocaleString("vi-VN"),
          }));
        setRecentActivities(recent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { maximumSignificantDigits: 3 }).format(n) +
    "đ";

  const pieColors = [
    "#3b82f6",
    "#f97316",
    "#10b981",
    "#a855f7",
    "#facc15",
    "#06b6d4",
  ];

  const statCards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      trend: stats.newUsersThisMonth,
      color: "text-blue-500",
    },
    {
      title: "Tours",
      value: stats.totalTours,
      icon: Compass,
      trend: "+",
      color: "text-orange-500",
    },
    {
      title: "Đặt tour",
      value: stats.totalBookings,
      icon: Calendar,
      trend: stats.totalBookings,
      color: "text-sky-500",
    },
    {
      title: "Đánh giá",
      value: stats.totalReviews,
      icon: TrendingUp,
      trend: stats.totalReviews,
      color: "text-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Đang tải dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Tổng quan hệ thống Đà Nẵng Tourism
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 font-semibold">
                  ↑ {stat.trend}
                </span>{" "}
                hoạt động gần đây
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doanh thu & Người dùng */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Doanh thu 7 tháng gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v / 1e6}tr`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-right">
              <p className="text-sm text-muted-foreground">
                Tháng này:{" "}
                <strong className="text-green-600">
                  {formatCurrency(stats.revenueThisMonth)}
                </strong>
                {stats.revenueLastMonth > 0 && (
                  <span
                    className={
                      stats.revenueThisMonth > stats.revenueLastMonth
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {" "}
                    (
                    {(
                      (stats.revenueThisMonth / stats.revenueLastMonth - 1) *
                      100
                    ).toFixed(0)}
                    %)
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#10b981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Phân bố tour & Hoạt động gần đây */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố tour theo khu vực/danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tourDistribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {tourDistribution.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có hoạt động nào
                </p>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {act.name} đặt tour <strong>{act.tour}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{act.id} • {act.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

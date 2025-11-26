import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Lỗi tải danh sách người dùng");
        }

        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        toast?.({
          title: "Lỗi",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "Chưa đăng nhập";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Tiêu đề */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Quản lý người dùng
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>
        <Badge className="text-sm bg-primary/10 text-primary">
          Tổng: {users.length}
        </Badge>
      </div>

      {/* Thẻ chính */}
      <Card className="shadow-md border border-border/50 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/40 py-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border border-border focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/60 transition-colors">
                  <TableHead className="font-semibold text-primary">
                    Tên
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-center text-primary">
                    Vai trò
                  </TableHead>
                  <TableHead className="font-semibold text-center text-primary">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="font-semibold text-center text-primary">
                    Lần đăng nhập gần nhất
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      className="hover:bg-muted/30 transition-all duration-200"
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                          className={
                            user.role === "admin"
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-800"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Không có người dùng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;

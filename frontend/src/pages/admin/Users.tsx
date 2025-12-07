import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "staff" | "admin";
  phone?: string;
  address?: string;
  bio?: string;
  birthDate?: string;
  createdAt: string;
  lastLogin?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");

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
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
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

  // Mở dialog sửa
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditOpen(true);
  };

  // Lưu thay đổi
  const handleSave = async () => {
    if (!editingUser) return;
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${editingUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingUser),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Cập nhật thất bại");
      }

      toast({ title: "Thành công", description: "Cập nhật người dùng thành công" });
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa người dùng
  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) return;

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Xóa thất bại");
      }

      toast({ title: "Thành công", description: "Xóa người dùng thành công" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-primary">Tên</TableHead>
                  <TableHead className="font-semibold text-primary">Email</TableHead>
                  <TableHead className="font-semibold text-primary text-center">Vai trò</TableHead>
                  <TableHead className="font-semibold text-primary text-center">Ngày tạo</TableHead>
                  <TableHead className="font-semibold text-primary text-center">Đăng nhập gần nhất</TableHead>
                  <TableHead className="font-semibold text-primary text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/30 transition-all">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={user.role === "admin" ? "default" : user.role === "staff" ? "outline" : "secondary"}
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
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(user)}
                            disabled={isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(user._id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Không có người dùng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog chỉnh sửa */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>

          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Họ tên</Label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email (không thể sửa)</Label>
                  <Input value={editingUser.email} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số điện thoại</Label>
                  <Input
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Địa chỉ</Label>
                  <Input
                    value={editingUser.address || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày sinh</Label>
                  <Input
                    type="date"
                    value={editingUser.birthDate || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Vai trò</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value: "user" | "staff" | "admin") =>
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="staff">staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tiểu sử (Bio)</Label>
                <Textarea
                  rows={3}
                  value={editingUser.bio || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
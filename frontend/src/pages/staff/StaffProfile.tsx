// src/pages/staff/StaffProfile.tsx
import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Mail, User, Phone, Calendar } from "lucide-react";

interface StaffProfile {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  birthDate?: string;
  createdAt?: string;
}

const formatDateVN = (dateStr?: string) => {
  if (!dateStr) return "Chưa cập nhật";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  } catch {
    return "Chưa cập nhật";
  }
};

const api = {
  get: async (url: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Không tải được dữ liệu");
    return res.json();
  },
  put: async (url: string, data: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Cập nhật thất bại");
    }
    return res.json();
  },
};

export default function StaffProfilePage() {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [formData, setFormData] = useState<Partial<StaffProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Nếu backend staff dùng endpoint khác, đổi URL tại đây
        const res = await api.get("/api/users/me");
        const u = res.user;

        const mapped: StaffProfile = {
          name: u.name || "Staff",
          email: u.email,
          phone: u.phone || "",
          avatar: u.avatar || "",
          birthDate: u.birthDate || "",
          createdAt: u.createdAt,
        };

        setUser(mapped);
        setFormData(mapped);

        // cập nhật localStorage để header staff đổi ngay
        localStorage.setItem("user", JSON.stringify(mapped));
        window.dispatchEvent(new Event("userUpdated"));
      } catch (err: any) {
        toast.error(err.message || "Không thể tải hồ sơ");
        if ((err.message || "").toLowerCase().includes("token")) {
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      toast.error("Vui lòng nhập họ tên và email");
      return;
    }

    try {
      setLoading(true);

      // Nếu backend staff dùng endpoint khác, đổi URL tại đây
      const updated = await api.put("/api/users/profile", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
      });

      const updatedUser = updated.user;

      setUser(updatedUser);
      setFormData(updatedUser);
      setIsEditing(false);

      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userUpdated"));

      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Chỉ chấp nhận ảnh");
    if (file.size > 3 * 1024 * 1024) return toast.error("Ảnh tối đa 3MB");

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX = 400;
        let w = img.width,
          h = img.height;

        if (w > h) {
          if (w > MAX) {
            h *= MAX / w;
            w = MAX;
          }
        } else {
          if (h > MAX) {
            w *= MAX / h;
            h = MAX;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);

        const compressed = canvas.toDataURL("image/webp", 0.8);

        try {
          // Nếu backend staff dùng endpoint khác, đổi URL tại đây
          const res = await api.put("/api/users/profile", { avatar: compressed });
          const updatedUser = res.user;

          setUser(updatedUser);
          setFormData((prev) => ({ ...prev, avatar: compressed }));

          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("userUpdated"));

          toast.success("Ảnh đại diện đã được cập nhật!");
        } catch (err: any) {
          toast.error("Lưu ảnh thất bại: " + err.message);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  };

  if (loading)
    return <div className="min-h-screen grid place-content-center text-xl">Đang tải...</div>;

  if (!user)
    return (
      <div className="min-h-screen grid place-content-center text-xl text-red-600">
        Không tìm thấy người dùng
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-16 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-200 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hồ Sơ Cá Nhân
          </h1>
        </div>

        <div className="grid gap-10">
          {/* Avatar Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Ảnh Đại Diện</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-8">
              <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
                <AvatarImage src={isEditing ? (formData.avatar as string) : user.avatar} />
                <AvatarFallback className="text-4xl">
                  {(user.name?.[0] || "S").toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <Button variant="outline" size="lg" disabled={loading}>
                <label className="cursor-pointer flex items-center gap-3">
                  <Camera className="h-5 w-5" /> Thay đổi ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </Button>
            </CardContent>
          </Card>

          {/* Thông tin cá nhân */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Thông Tin Cá Nhân</CardTitle>
            </CardHeader>

            <CardContent className="space-y-7">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Họ và Tên
                </Label>
                {isEditing ? (
                  <Input name="name" value={formData.name || ""} onChange={handleChange} />
                ) : (
                  <p className="text-lg font-medium">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                {isEditing ? (
                  <Input name="email" type="email" value={formData.email || ""} onChange={handleChange} />
                ) : (
                  <p className="text-lg">{user.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Số điện thoại
                </Label>
                {isEditing ? (
                  <Input name="phone" value={formData.phone || ""} onChange={handleChange} />
                ) : (
                  <p className="text-lg">{user.phone || "Chưa cập nhật"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Ngày sinh
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-lg">{formatDateVN(user.birthDate)}</p>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="lg" disabled={loading}>
                      {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(user);
                      }}
                      disabled={loading}
                    >
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setFormData(user);
                      setIsEditing(true);
                    }}
                    size="lg"
                  >
                    Chỉnh Sửa Hồ Sơ
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

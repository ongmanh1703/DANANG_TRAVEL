import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Search, Edit, Trash2, Clock, MapPin, Users,
  ImagePlus, DollarSign, Calendar, Tag, CheckSquare, AlertCircle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const API_BASE = "http://localhost:5000/api/tours";

const callAPI = async (url: string, options = {}) => {
  const token = localStorage.getItem("token");
  const headers: any = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Lỗi kết nối server");
  }
  return data;
};

const Tours = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);
  const [preview, setPreview] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    image: "",
    price: "",
    originalPrice: "",
    duration: "",
    groupSize: "",
    highlights: [],
    departure: "",
    category: "",
    includes: [],
    status: "draft",
    description: "",
  });

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    setLoading(true);
    try {
      const data = await callAPI(API_BASE);
      setTours(data);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = tours.filter((tour) =>
    tour.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openForm = (tour: any = null) => {
    setEditingTour(tour);
    if (tour) {
      setFormData({
        title: tour.title || "",
        image: tour.image || "",
        price: tour.price?.toString() || "",
        originalPrice: tour.originalPrice?.toString() || "",
        duration: tour.duration || "",
        groupSize: tour.groupSize || "",
        highlights: tour.highlights || [],
        departure: tour.departure || "",
        category: tour.category || "",
        includes: tour.includes || [],
        status: tour.status || "draft",
        description: tour.description || "",
      });
      setPreview(tour.image ? `http://localhost:5000${tour.image}` : "");
    } else {
      setFormData({
        title: "", image: "", price: "", originalPrice: "", duration: "",
        groupSize: "", highlights: [], departure: "", category: "", includes: [],
        status: "draft", description: "",
      });
      setPreview("");
    }
    setOpenDialog(true);
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  // ĐÚNG NHƯ CODE CŨ CỦA BẠN: split("\n") - không trim, không filter
  const handleArrayChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.split("\n"),
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.duration) {
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: "Vui lòng nhập tiêu đề, giá và thời lượng",
        variant: "destructive",
      });
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("title", formData.title);
    formDataUpload.append("price", formData.price);
    formDataUpload.append("duration", formData.duration);
    formDataUpload.append("originalPrice", formData.originalPrice || "");
    formDataUpload.append("groupSize", formData.groupSize || "");
    formDataUpload.append("highlights", JSON.stringify(formData.highlights));
    formDataUpload.append("departure", formData.departure || "");
    formDataUpload.append("category", formData.category || "");
    formDataUpload.append("includes", JSON.stringify(formData.includes));
    formDataUpload.append("status", formData.status);
    formDataUpload.append("description", formData.description);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      formDataUpload.append("image", fileInput.files[0]);
    } else if (formData.image) {
      formDataUpload.append("image", formData.image);
    }

    try {
      const token = localStorage.getItem("token");
      const url = editingTour ? `${API_BASE}/${editingTour._id}` : API_BASE;
      const method = editingTour ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi khi lưu tour");

      data.image = data.image.startsWith('http') ? data.image : `http://localhost:5000${data.image}`;

      if (editingTour) {
        setTours(prev => prev.map(t => t._id === editingTour._id ? data : t));
        toast({ title: "Cập nhật thành công!" });
      } else {
        setTours(prev => [...prev, data]);
        toast({ title: "Thêm tour thành công!" });
      }
      setOpenDialog(false);
      setEditingTour(null);
      setPreview("");
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa tour này?")) return;
    try {
      await callAPI(`${API_BASE}/${id}`, { method: "DELETE" });
      setTours(prev => prev.filter(t => t._id !== id));
      toast({ title: "Đã xóa!" });
    } catch (err: any) {
      toast({ title: "Lỗi xóa", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tours</h1>
          <p className="text-gray-600 mt-1">Tạo, chỉnh sửa và quản lý tour du lịch</p>
        </div>
        <Button onClick={() => openForm()} className="shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          Thêm tour mới
        </Button>
      </div>

      {/* Search & List */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên tour..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải tours...</p>
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-gray-600">
                {searchTerm ? "Không tìm thấy tour nào." : "Chưa có tour nào được tạo."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTours.map((tour) => (
                <Card key={tour._id} className="group overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border">
                  <div className="relative aspect-video overflow-hidden">
                    {tour.image ? (
                      <img
                        src={`http://localhost:5000${tour.image}`}
                        alt={tour.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center">
                        <Tag className="h-16 w-16 text-white opacity-70" />
                      </div>
                    )}
                    <Badge
                      className="absolute top-3 right-3 shadow-md"
                      variant={tour.status === "published" ? "default" : "secondary"}
                    >
                      {tour.status === "published" ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-1 text-gray-900">{tour.title}</h3>

                    <div className="space-y-1.5 text-sm text-gray-600">
                      <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-600" />{tour.duration}</p>
                      {tour.departure && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-green-600" />{tour.departure}</p>}
                      {tour.groupSize && <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-purple-600" />{tour.groupSize}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-blue-700">{Number(tour.price).toLocaleString()} ₫</p>
                        {tour.originalPrice > tour.price && (
                          <p className="text-xs line-through text-gray-500">{Number(tour.originalPrice).toLocaleString()} ₫</p>
                        )}
                      </div>
                    </div>

                    {/* Hiển thị đúng như cũ */}
                    {tour.highlights?.length > 0 && (
                      <div className="text-sm text-gray-700 whitespace-pre-line mt-2">
                        <strong>Điểm nổi bật:</strong>
                        <div className="mt-1 space-y-1">
                          {tour.highlights.map((item: string, i: number) => (
                            <div key={i}>• {item}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tour.includes?.length > 0 && (
                      <div className="text-sm text-gray-700 whitespace-pre-line mt-2">
                        <strong>Bao gồm:</strong>
                        <div className="mt-1 space-y-1">
                          {tour.includes.map((item: string, i: number) => (
                            <div key={i}>• {item}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tour.description && (
                      <div className="text-sm text-gray-600 mt-3 line-clamp-3">
                        <strong>Mô tả:</strong> {tour.description}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openForm(tour)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(tour._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form - ĐÃ XÓA RATING & REVIEWS - GIỮ NGUYÊN XỬ LÝ MẢNG CŨ */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 bg-white border-b p-6 z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingTour ? (
                <>
                  <Edit className="h-6 w-6 text-blue-600" />
                  Chỉnh sửa tour
                </>
              ) : (
                <>
                  <Plus className="h-6 w-6 text-green-600" />
                  Thêm tour mới
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Ảnh */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <ImagePlus className="h-4 w-4" /> Ảnh tour
              </Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  <ImagePlus className="h-4 w-4" /> Chọn ảnh từ máy
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {preview && (
                  <div className="flex-1">
                    <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border shadow-sm" />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" /> Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">Tiêu đề <span className="text-red-500">*</span></Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Bà Nà Hills Adventure" className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-1">Giá (₫) <span className="text-red-500">*</span></Label>
                  <Input value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="1.200.000" className="mt-1" />
                </div>
                <div>
                  <Label>Giá gốc (khuyến mãi)</Label>
                  <Input value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} placeholder="1.500.000" className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-1">Thời lượng <span className="text-red-500">*</span></Label>
                  <Input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="1 ngày" className="mt-1" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Thông tin bổ sung */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" /> Thông tin bổ sung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Số người tối đa</Label>
                  <Input value={formData.groupSize} onChange={(e) => setFormData({ ...formData, groupSize: e.target.value })} placeholder="10-15 người" className="mt-1" />
                </div>
                <div>
                  <Label>Địa Điểm</Label>
                  <Input value={formData.departure} onChange={(e) => setFormData({ ...formData, departure: e.target.value })} placeholder="Đà Nẵng" className="mt-1" />
                </div>
                <div>
                  <Label>Danh mục</Label>
                  <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Biển, Văn hóa..." className="mt-1" />
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Đã xuất bản</option>
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Nội dung chi tiết - GIỮ NGUYÊN XỬ LÝ CŨ */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-teal-600" /> Nội dung chi tiết
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Điểm nổi bật (mỗi dòng 1 mục)</Label>
                  <Textarea
                    value={formData.highlights.join("\n")}
                    onChange={(e) => handleArrayChange("highlights", e.target.value)}
                    placeholder="Biển xanh cát trắng&#10;Khám phá di tích&#10;Ẩm thực đặc sản"
                    rows={5}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Bao gồm (mỗi dòng 1 mục)</Label>
                  <Textarea
                    value={formData.includes.join("\n")}
                    onChange={(e) => handleArrayChange("includes", e.target.value)}
                    placeholder="Xe đưa đón&#10;Hướng dẫn viên&#10;Bữa trưa"
                    rows={5}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">Mô tả chi tiết tour</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Viết mô tả chi tiết về hành trình, lịch trình, trải nghiệm, lưu ý..."
                  rows={8}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-white border-t p-6">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button onClick={handleSave} className="shadow-lg">
              {editingTour ? "Cập nhật tour" : "Thêm tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tours;
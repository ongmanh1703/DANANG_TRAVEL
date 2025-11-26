import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, ImagePlus, Film, Star, MapPin, History, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categoryLabels = {
  am_thuc: "Ẩm thực",
  tin_tuc: "Tin tức",
  kham_pha: "Khám phá",
};

const foodTypes = [
  { value: "mon_chinh", label: "Món chính" },
  { value: "mon_nhe", label: "Món nhẹ" },
  { value: "trang_mieng", label: "Tráng miệng" },
];

const newsTypes = [
  { value: "tin_du_lich", label: "Tin du lịch" },
  { value: "su_kien", label: "Sự kiện" },
  { value: "le_hoi", label: "Lễ hội" },
  { value: "cam_nang", label: "Cẩm nang" },
  { value: "review", label: "Review" },
];

const placeTypes = [
  { value: "bai_bien", label: "Bãi biển" },
  { value: "nui_rung", label: "Núi rừng" },
  { value: "tam_linh", label: "Tâm linh" },
  { value: "vui_choi", label: "Vui chơi" },
  { value: "van_hoa", label: "Văn hóa" },
];

const getYouTubeEmbed = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const PostManager = ({ category }: { category: "am_thuc" | "tin_tuc" | "kham_pha" }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    images: [] as File[],
    videoUrl: "",
    place: "",
    price: "",
    status: "draft" as "draft" | "published",
    placeType: "",
    foodType: "",
    newsType: "",
    isFeatured: false,
    overview: "",
    history: "",
    notes: "",
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const API_URL = "/api/posts";
  const token = localStorage.getItem("token");
  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    fetchPosts();
    return () => {
      imagePreviews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [category]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Không thể tải bài viết", variant: "destructive" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - imagePreviews.length);
    if (files.length === 0) return;

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const url = imagePreviews[index];
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const openDialog = (post = null) => {
    setEditingPost(post);
    if (post) {
      setFormData({
        title: post.title || "",
        content: post.content || "",
        images: [],
        videoUrl: post.videoUrl || "",
        place: post.place || "",
        price: post.price?.toString() || "",
        status: post.status || "draft",
        placeType: post.placeType || "",
        foodType: post.foodType || "",
        newsType: post.newsType || "",
        isFeatured: post.isFeatured || false,
        overview: post.overview || "",
        history: post.history || "",
        notes: post.notes || "",
      });

      const fullImageUrls = (post.images || []).map((img: string) =>
        img.startsWith("http") ? img : `${BACKEND_URL}${img}`
      );
      setImagePreviews(fullImageUrls);
    } else {
      setFormData({
        title: "",
        content: "",
        images: [],
        videoUrl: "",
        place: "",
        price: "",
        status: "draft",
        placeType: "",
        foodType: "",
        newsType: "",
        isFeatured: false,
        overview: "",
        history: "",
        notes: "",
      });
      setImagePreviews([]);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    // Validate cơ bản
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Lỗi", description: "Tiêu đề và nội dung là bắt buộc", variant: "destructive" });
      return;
    }

    // Validate theo category
    if (category === "am_thuc" && !formData.foodType) {
      toast({ title: "Lỗi", description: "Vui lòng chọn loại món ăn", variant: "destructive" });
      return;
    }
    if (category === "tin_tuc" && !formData.newsType) {
      toast({ title: "Lỗi", description: "Vui lòng chọn loại tin tức", variant: "destructive" });
      return;
    }
    if (category === "kham_pha") {
      if (!formData.overview?.trim()) {
        toast({ title: "Lỗi", description: "Tổng quan là bắt buộc", variant: "destructive" });
        return;
      }
      if (!formData.history?.trim()) {
        toast({ title: "Lỗi", description: "Lịch sử là bắt buộc", variant: "destructive" });
        return;
      }
      if (!formData.notes?.trim()) {
        toast({ title: "Lỗi", description: "Lưu ý là bắt buộc", variant: "destructive" });
        return;
      }
      if (!formData.placeType) {
        toast({ title: "Lỗi", description: "Vui lòng chọn loại địa điểm", variant: "destructive" });
        return;
      }
    }

    const form = new FormData();
    form.append("title", formData.title.trim());
    form.append("content", formData.content.trim());
    form.append("category", category);
    form.append("status", formData.status);
    form.append("isFeatured", formData.isFeatured ? "1" : "0");

    if (formData.place) form.append("place", formData.place);
    if (formData.price) form.append("price", formData.price);
    if (formData.videoUrl) form.append("videoUrl", formData.videoUrl);
    if (formData.placeType) form.append("placeType", formData.placeType);
    if (formData.foodType) form.append("foodType", formData.foodType);
    if (formData.newsType) form.append("newsType", formData.newsType);
    if (formData.overview) form.append("overview", formData.overview.trim());
    if (formData.history) form.append("history", formData.history.trim());
    if (formData.notes) form.append("notes", formData.notes.trim());

    formData.images.forEach((file) => form.append("images", file));

    try {
      const url = editingPost ? `${API_URL}/${editingPost._id}` : API_URL;
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (res.ok) {
        toast({ title: editingPost ? "Cập nhật thành công!" : "Thêm bài thành công!" });
        fetchPosts();
        setOpen(false);
      } else {
        const err = await res.json();
        toast({ title: "Lỗi", description: err.message || "Đã có lỗi xảy ra", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi mạng", description: "Không thể kết nối server", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa bài viết này? Hành động không thể hoàn tác.")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Đã xóa bài viết!" });
        fetchPosts();
      }
    } catch (err) {
      toast({ title: "Lỗi xóa", variant: "destructive" });
    }
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.place && p.place.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const showVideo = ["am_thuc", "kham_pha"].includes(category);
  const isNews = category === "tin_tuc";

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h2 className="text-3xl font-bold">Quản lý {categoryLabels[category]}</h2>
          <p className="text-muted-foreground">Quản lý bài viết {categoryLabels[category].toLowerCase()}</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Thêm bài
        </Button>
      </div>

      {/* Tin nổi bật */}
      {isNews && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="text-yellow-600" />
              <span className="text-yellow-800">Tin tức nổi bật</span>
            </h3>
          </CardHeader>
          <CardContent>
            {posts.find(p => p.isFeatured) ? (
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                <img
                  src={posts.find(p => p.isFeatured)?.images?.[0]
                    ? (posts.find(p => p.isFeatured)?.images[0].startsWith("http")
                        ? posts.find(p => p.isFeatured)?.images[0]
                        : `${BACKEND_URL}${posts.find(p => p.isFeatured)?.images[0]}`)
                    : "/placeholder.svg"}
                  alt="Featured"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold text-lg">{posts.find(p => p.isFeatured)?.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">
                      {newsTypes.find(t => t.value === posts.find(p => p.isFeatured)?.newsType)?.label}
                    </Badge>
                    <Badge className="bg-yellow-500 text-white">Nổi bật</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Chưa chọn tin nổi bật</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm tiêu đề hoặc địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                {category === "am_thuc" && <TableHead>Loại món</TableHead>}
                {category === "am_thuc" && <TableHead>Giá</TableHead>}
                {category === "tin_tuc" && <TableHead>Loại tin</TableHead>}
                {category === "tin_tuc" && <TableHead>Nổi bật</TableHead>}
                {category === "kham_pha" && <TableHead className="w-32">Địa điểm</TableHead>}
                {category === "kham_pha" && <TableHead>Loại</TableHead>}
                {showVideo && <TableHead>Video</TableHead>}
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                    Không tìm thấy bài viết nào
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((post) => (
                  <TableRow key={post._id} className={post.isFeatured ? "bg-yellow-50/70" : ""}>
                    <TableCell>
                      {post.images?.[0] ? (
                        <img
                          src={post.images[0].startsWith("http") ? post.images[0] : `${BACKEND_URL}${post.images[0]}`}
                          alt=""
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : <div className="w-12 h-12 bg-gray-200 rounded border" />}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate pr-2">{post.title}</div>
                    </TableCell>

                    {/* Ẩm thực */}
                    {category === "am_thuc" && (
                      <>
                        <TableCell>
                          <Badge variant="outline">
                            {foodTypes.find(t => t.value === post.foodType)?.label || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{post.price ? `${Number(post.price).toLocaleString()}đ` : "—"}</TableCell>
                      </>
                    )}

                    {/* Tin tức */}
                    {category === "tin_tuc" && (
                      <>
                        <TableCell>
                          <Badge variant="outline">
                            {newsTypes.find(t => t.value === post.newsType)?.label || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.isFeatured ? (
                            <Badge className="bg-yellow-500 text-white">Nổi bật</Badge>
                          ) : "—"}
                        </TableCell>
                      </>
                    )}

                    {/* Khám phá */}
                    {category === "kham_pha" && (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{post.place || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {placeTypes.find(p => p.value === post.placeType)?.label || "—"}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {showVideo && (
                      <TableCell>
                        {post.videoUrl ? <Film className="h-4 w-4 text-blue-600" /> : "—"}
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status === "published" ? "Đã đăng" : "Nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="main" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Thông tin chính</TabsTrigger>
              {category === "kham_pha" && <TabsTrigger value="detail">Chi tiết khám phá</TabsTrigger>}
            </TabsList>

            <TabsContent value="main" className="space-y-6 mt-6">
              {/* Nổi bật (chỉ tin tức) */}
              {isNews && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-5">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-6 h-6 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <Label htmlFor="featured" className="text-lg font-bold text-amber-800 cursor-pointer">
                      Đặt làm tin nổi bật
                    </Label>
                  </div>
                  <p className="text-sm text-amber-700 mt-2 ml-10">
                    Chỉ một bài được chọn. Sẽ hiển thị đầu trang chủ với hiệu ứng đặc biệt.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label className="font-semibold">Tiêu đề *</Label>
                    <Input
                      placeholder="Nhập tiêu đề hấp dẫn..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  {(category === "am_thuc" || category === "kham_pha") && (
                    <div>
                      <Label className="font-semibold">Địa điểm / Nhà hàng</Label>
                      <Input
                        placeholder="VD: Bà Nà Hills, Làng Chài Hội An..."
                        value={formData.place}
                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {category === "am_thuc" && (
                    <>
                      <div>
                        <Label className="font-semibold">Loại món ăn *</Label>
                        <Select value={formData.foodType} onValueChange={(v) => setFormData({ ...formData, foodType: v })}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                          <SelectContent>{foodTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-semibold">Giá (VNĐ)</Label>
                        <Input
                          type="number"
                          placeholder="150000"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}

                  {category === "tin_tuc" && (
                    <div>
                      <Label className="font-semibold">Loại tin tức *</Label>
                      <Select value={formData.newsType} onValueChange={(v) => setFormData({ ...formData, newsType: v })}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                        <SelectContent>{newsTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "kham_pha" && (
                    <div>
                      <Label className="font-semibold">Loại địa điểm *</Label>
                      <Select value={formData.placeType} onValueChange={(v) => setFormData({ ...formData, placeType: v })}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                        <SelectContent>{placeTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="font-semibold">Nội dung chi tiết *</Label>
                    <Textarea
                      placeholder="Mô tả đầy đủ, hấp dẫn..."
                      className="min-h-48 mt-2 resize-none"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                  </div>

                  {showVideo && (
                    <div>
                      <Label className="font-semibold">Video YouTube</Label>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="mt-2"
                      />
                      {getYouTubeEmbed(formData.videoUrl) && (
                        <iframe className="w-full h-64 mt-3 rounded-lg border" src={getYouTubeEmbed(formData.videoUrl)!} allowFullScreen />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hình ảnh */}
              <div>
                <Label className="font-semibold">Hình ảnh (tối đa 5)</Label>
                <div className="flex flex-wrap gap-4 mt-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-28 h-28 object-cover rounded-lg border-2 shadow" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <label className="w-28 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <span className="text-xs mt-1">Thêm</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label className="font-semibold">Trạng thái</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger className="w-48 mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Nháp</SelectItem>
                    <SelectItem value="published">Đã xuất bản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Tab chi tiết khám phá */}
            {category === "kham_pha" && (
              <TabsContent value="detail" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  <div>
                    <Label className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Tổng quan *
                    </Label>
                    <Textarea
                      placeholder="Giới thiệu ngắn gọn về địa điểm, lý do nên đến..."
                      className="min-h-32 mt-2"
                      value={formData.overview}
                      onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="font-semibold flex items-center gap-2">
                      <History className="h-5 w-5 text-amber-600" />
                      Lịch sử *
                    </Label>
                    <Textarea
                      placeholder="Nguồn gốc, sự kiện lịch sử, truyền thuyết..."
                      className="min-h-32 mt-2"
                      value={formData.history}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Lưu ý khi tham quan *
                    </Label>
                    <Textarea
                      placeholder="- Giờ mở cửa: 7h - 17h&#10;- Vé: 40.000đ&#10;- Mang giày leo núi&#10;- Tránh mùa mưa..."
                      className="min-h-40 mt-2 font-mono text-sm"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="px-8">
              {editingPost ? "Cập nhật" : "Tạo bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostManager;
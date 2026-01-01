import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  X,
  ImagePlus,
  Film,
  Star,
  MapPin,
  History,
  AlertCircle,
} from "lucide-react";
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

// ✅ Bắt cả {{img1}} và {{ img1 }}
const getUsedImgIndexes = (content: string) => {
  const used = new Set<number>();
  const re = /\{\{\s*img(\d+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content || ""))) {
    const idx = Number(m[1]);
    if (!Number.isNaN(idx)) used.add(idx);
  }
  return used;
};

const normalizeParagraphs = (s: string) => (s || "").replace(/\n{3,}/g, "\n\n");

type Category = "am_thuc" | "tin_tuc" | "kham_pha";

type PreviewItem = {
  id: string; 
  src: string; 
  kind: "existing" | "new";
  file?: File; 
  original?: string; 
};

const StaffPostManager = ({ category }: { category: Category }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    videoUrl: "",
    place: "",
    price: "",
    status: "published" as "published",
    placeType: "",
    foodType: "",
    newsType: "",
    isFeatured: false,
    overview: "",
    history: "",
    notes: "",
  });

  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const usedImgSet = useMemo(() => getUsedImgIndexes(formData.content), [formData.content]);

  const API_URL = "/api/posts";
  const token = localStorage.getItem("token");
  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    fetchPosts();
    return () => {
      previewItems.forEach((it) => {
        if (it.kind === "new" && it.src.startsWith("blob:")) URL.revokeObjectURL(it.src);
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
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải bài viết", variant: "destructive" });
    }
  };

  const insertAtCursor = (insertText: string) => {
    const el = contentRef.current;
    if (!el) return;

    const start = el.selectionStart ?? formData.content.length;
    const end = el.selectionEnd ?? formData.content.length;

    const before = formData.content.slice(0, start);
    const after = formData.content.slice(end);

    const next = `${before}${insertText}${after}`;
    setFormData((prev) => ({ ...prev, content: next }));

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insertText.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const remain = 5 - previewItems.length;
    const files = Array.from(e.target.files || []).slice(0, remain);
    if (!files.length) return;

    const newItems: PreviewItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      src: URL.createObjectURL(file),
      kind: "new",
      file,
    }));

    setPreviewItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const syncMarkersWithItems = (content: string, prevItems: PreviewItem[], nextItems: PreviewItem[]) => {
    const nextIndexById = new Map<string, number>();
    nextItems.forEach((it, idx) => nextIndexById.set(it.id, idx));

    let out = (content || "").replace(/\{\{\s*img(\d+)\s*\}\}/g, (full, n) => {
      const oldIdx = Number(n);
      if (Number.isNaN(oldIdx)) return full;

      const oldItem = prevItems[oldIdx];
      if (!oldItem) return ""; 

      const newIdx = nextIndexById.get(oldItem.id);
      if (newIdx === undefined) return ""; 
      if (newIdx === 0) return ""; 
      return `{{img${newIdx}}}`;
    });

    out = out.replace(/\{\{\s*img0\s*\}\}/g, "");
    return normalizeParagraphs(out);
  };

  const moveImage = (from: number, to: number) => {
    if (from === to) return;

    setPreviewItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);

      setFormData((fd) => ({
        ...fd,
        content: syncMarkersWithItems(fd.content, prev, next),
      }));

      return next;
    });
  };

  const removeImage = (index: number) => {
    setPreviewItems((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);

      if (removed?.kind === "new" && removed.src.startsWith("blob:")) {
        URL.revokeObjectURL(removed.src);
      }

      setFormData((fd) => ({
        ...fd,
        content: syncMarkersWithItems(fd.content, prev, next),
      }));

      return next;
    });
  };

  const openDialog = (post: any = null) => {
    setEditingPost(post);

    if (post) {
      setFormData({
        title: post.title || "",
        content: post.content || "",
        videoUrl: post.videoUrl || "",
        place: category === "am_thuc" ? "" : post.place || "",
        price: post.price?.toString() || "",
        status: "published",
        placeType: post.placeType || "",
        foodType: post.foodType || "",
        newsType: post.newsType || "",
        isFeatured: !!post.isFeatured,
        overview: post.overview || "",
        history: post.history || "",
        notes: post.notes || "",
      });

      const items: PreviewItem[] = (post.images || []).map((img: string, idx: number) => {
        const full = img?.startsWith("http") ? img : `${BACKEND_URL}${img?.startsWith("/") ? "" : "/"}${img}`;
        return {
          id: `existing-${idx}-${img}`, 
          src: full || "/placeholder.svg",
          kind: "existing",
          original: img, 
        };
      });

      setPreviewItems(items);
    } else {
      setFormData({
        title: "",
        content: "",
        videoUrl: "",
        place: "",
        price: "",
        status: "published",
        placeType: "",
        foodType: "",
        newsType: "",
        isFeatured: false,
        overview: "",
        history: "",
        notes: "",
      });
      setPreviewItems([]);
    }

    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Lỗi", description: "Tiêu đề và nội dung là bắt buộc", variant: "destructive" });
      return;
    }

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

    const cleanedContent = (formData.content || "").replace(/\{\{\s*img0\s*\}\}/g, "").trim();
    form.append("content", cleanedContent);

    form.append("category", category);

    form.append("status", "published");

    form.append("isFeatured", formData.isFeatured ? "1" : "0");

    if (category !== "am_thuc" && formData.place) form.append("place", formData.place);

    if (formData.price) form.append("price", formData.price);
    if (formData.videoUrl) form.append("videoUrl", formData.videoUrl);
    if (formData.placeType) form.append("placeType", formData.placeType);
    if (formData.foodType) form.append("foodType", formData.foodType);
    if (formData.newsType) form.append("newsType", formData.newsType);
    if (formData.overview) form.append("overview", formData.overview.trim());
    if (formData.history) form.append("history", formData.history.trim());
    if (formData.notes) form.append("notes", formData.notes.trim());

    const existingImages = previewItems
      .filter((it) => it.kind === "existing")
      .map((it) => it.original ?? it.src);

    form.append("existingImagesJson", JSON.stringify(existingImages));

    previewItems
      .filter((it) => it.kind === "new" && it.file)
      .forEach((it) => form.append("images", it.file as File));

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
    } catch {
      toast({ title: "Lỗi mạng", description: "Không thể kết nối server", variant: "destructive" });
    }
  };

  // chỉ hiển thị các bài đã xuất bản
  const publishedPosts = useMemo(() => posts.filter((p) => p?.status === "published"), [posts]);

  const filtered = publishedPosts.filter((p) => {
    const term = searchTerm.toLowerCase();
    if (category === "am_thuc") return (p.title || "").toLowerCase().includes(term);
    return (
      (p.title || "").toLowerCase().includes(term) ||
      (p.place && (p.place || "").toLowerCase().includes(term))
    );
  });

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
            {publishedPosts.find((p) => p.isFeatured) ? (
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                <img
                  src={
                    publishedPosts.find((p) => p.isFeatured)?.images?.[0]
                      ? publishedPosts.find((p) => p.isFeatured)?.images[0].startsWith("http")
                        ? publishedPosts.find((p) => p.isFeatured)?.images[0]
                        : `${BACKEND_URL}${
                            publishedPosts.find((p) => p.isFeatured)?.images[0].startsWith("/") ? "" : "/"
                          }${publishedPosts.find((p) => p.isFeatured)?.images[0]}`
                      : "/placeholder.svg"
                  }
                  alt="Featured"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold text-lg">{publishedPosts.find((p) => p.isFeatured)?.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">
                      {newsTypes.find((t) => t.value === publishedPosts.find((p) => p.isFeatured)?.newsType)?.label}
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
                placeholder={category === "am_thuc" ? "Tìm kiếm tiêu đề..." : "Tìm kiếm tiêu đề hoặc địa điểm..."}
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
                          src={
                            post.images[0].startsWith("http")
                              ? post.images[0]
                              : `${BACKEND_URL}${post.images[0].startsWith("/") ? "" : "/"}${post.images[0]}`
                          }
                          alt=""
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded border" />
                      )}
                    </TableCell>

                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate pr-2">{post.title}</div>
                    </TableCell>

                    {category === "am_thuc" && (
                      <>
                        <TableCell>
                          <Badge variant="outline">{foodTypes.find((t) => t.value === post.foodType)?.label || "—"}</Badge>
                        </TableCell>
                        <TableCell>{post.price ? `${Number(post.price).toLocaleString()}đ` : "—"}</TableCell>
                      </>
                    )}

                    {category === "tin_tuc" && (
                      <>
                        <TableCell>
                          <Badge variant="outline">{newsTypes.find((t) => t.value === post.newsType)?.label || "—"}</Badge>
                        </TableCell>
                        <TableCell>{post.isFeatured ? <Badge className="bg-yellow-500 text-white">Nổi bật</Badge> : "—"}</TableCell>
                      </>
                    )}

                    {category === "kham_pha" && (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{post.place || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{placeTypes.find((p) => p.value === post.placeType)?.label || "—"}</Badge>
                        </TableCell>
                      </>
                    )}

                    {showVideo && <TableCell>{post.videoUrl ? <Film className="h-4 w-4 text-blue-600" /> : "—"}</TableCell>}

                    <TableCell>
                      <Badge variant="default">Đã đăng</Badge>
                    </TableCell>

                    <TableCell className="text-xs">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</TableCell>

                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="main" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Thông tin chính</TabsTrigger>
              {category === "kham_pha" && <TabsTrigger value="detail">Chi tiết khám phá</TabsTrigger>}
            </TabsList>

            <TabsContent value="main" className="space-y-6 mt-6">
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
                  <p className="text-sm text-amber-700 mt-2 ml-10">Chỉ một bài được chọn. Sẽ hiển thị đầu trang chủ.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label className="font-semibold">Tiêu đề *</Label>
                    <Input
                      placeholder="Nhập tiêu đề..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  {/* Chỉ "khám phá" mới có địa điểm */}
                  {category === "kham_pha" && (
                    <div>
                      <Label className="font-semibold">Địa điểm</Label>
                      <Input
                        placeholder="VD: Bà Nà Hills..."
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
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                          <SelectContent>
                            {foodTypes.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
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
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {newsTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "kham_pha" && (
                    <div>
                      <Label className="font-semibold">Loại địa điểm *</Label>
                      <Select value={formData.placeType} onValueChange={(v) => setFormData({ ...formData, placeType: v })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {placeTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="font-semibold">Nội dung chi tiết *</Label>
                    <Textarea
                      ref={contentRef}
                      placeholder="Mô tả đầy đủ..."
                      className="min-h-48 mt-2 resize-none"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                    {previewItems.length > 1 && (
                      <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                        <div className="text-sm font-semibold mb-2">Chèn ảnh vào nội dung (img1–img4). Ảnh HERO = img0</div>

                        <div className="flex flex-wrap gap-2">
                          {previewItems.map((_, i) => {
                            if (i === 0) return null; // img0 không cho chèn
                            if (usedImgSet.has(i)) return null; // đã chèn thì ẩn
                            return (
                              <Button
                                key={i}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertAtCursor(`\n\n{{img${i}}}\n\n`)}
                              >
                                Chèn img{i}
                              </Button>
                            );
                          })}
                        </div>

                        <div className="text-xs text-muted-foreground mt-2">
                          * Ảnh đã chèn sẽ tự ẩn nút để tránh nhầm. (img0 không chèn vào nội dung)
                        </div>
                      </div>
                    )}
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
                        <iframe
                          className="w-full h-64 mt-3 rounded-lg border"
                          src={getYouTubeEmbed(formData.videoUrl)!}
                          allowFullScreen
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="font-semibold">Hình ảnh (tối đa 5) • Kéo thả để đổi thứ tự • Ảnh đầu tiên = HERO</Label>

                <div className="flex flex-wrap gap-4 mt-3">
                  {previewItems.map((it, i) => (
                    <div
                      key={it.id}
                      className="relative group"
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex === null) return;
                        moveImage(dragIndex, i);
                        setDragIndex(null);
                      }}
                    >
                      <img src={it.src} alt="" className="w-28 h-28 object-cover rounded-lg border-2 shadow" />

                      {i === 0 && (
                        <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-1 rounded bg-black/70 text-white">
                          HERO
                        </span>
                      )}

                      <span className="absolute bottom-2 left-2 text-[11px] font-bold px-2 py-1 rounded bg-white/80 text-black">
                        img{i}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                        title="Xóa ảnh"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {previewItems.length < 5 && (
                    <label className="w-28 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <span className="text-xs mt-1">Thêm</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-3">
                <Label className="font-semibold">Trạng thái</Label>
                <div className="mt-2">
                  <Badge variant="default">Đã xuất bản</Badge>
                </div>
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
                      placeholder="Giới thiệu ngắn gọn..."
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
                      placeholder="Nguồn gốc..."
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
                      placeholder="- Giờ mở cửa..."
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} className="px-8">
              {editingPost ? "Cập nhật" : "Tạo bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPostManager;

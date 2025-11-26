import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Phone, Mail, LogOut, Bus, User, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const loadUser = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          avatar: parsed.avatar || parsed.profileImage || "",
          name: parsed.name || parsed.fullname || parsed.email?.split("@")[0] || "Người dùng"
        });
      } catch (e) {
        console.error("Lỗi parse user:", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    const handleUpdate = () => {
      console.log("userUpdated event → Header reload user");
      loadUser();
    };

    window.addEventListener("userUpdated", handleUpdate);
    return () => window.removeEventListener("userUpdated", handleUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/");
    setIsMenuOpen(false);
  };

  const navigationItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Giới thiệu", href: "/about" },
    { label: "Khám phá", href: "/destinations" },
    { label: "Tour du lịch", href: "/tours" },
    { label: "Ẩm thực", href: "/cuisine" },
    { label: "Tin tức", href: "/news" },
  ];

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const displayName = user?.name || user?.fullname || user?.email?.split("@")[0] || "Người dùng";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-sm">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Đà Nẵng, Việt Nam</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>+84 236 3888 888</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>info@danangtravel.vn</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {!user && (
                <>
                  <Link to="/login"><Button variant="ghost" size="sm">Đăng nhập</Button></Link>
                  <Link to="/register"><Button variant="outline" size="sm">Đăng ký</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Du lịch Đà Nẵng</h1>
              <p className="text-xs text-muted-foreground">Thành phố đáng sống</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8">
              {navigationItems.map(item => (
                <Link key={item.href} to={item.href} className="font-medium hover:text-primary transition">
                  {item.label}
                </Link>
              ))}
            </nav>

            {user && (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/my-bookings">
                  <Button variant="ghost" size="icon"><Bus className="h-6 w-6" /></Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 pr-3 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden xl:block font-medium">{displayName}</span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" /> Thông tin cá nhân
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-bookings")}>
                      <Bus className="mr-2 h-4 w-4" /> Tour đã đặt
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-4">
              {navigationItems.map(item => (
                <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)}
                  className="font-medium py-2 hover:text-primary">
                  {item.label}
                </Link>
              ))}

              {user ? (
                <>
                  <div className="flex items-center gap-3 py-3 border-b">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2">
                    <User className="h-5 w-5" /> Thông tin cá nhân
                  </Link>
                  <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2">
                    <Bus className="h-5 w-5" /> Tour đã đặt
                  </Link>
                  <Button variant="destructive" className="w-full mt-3" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Đăng nhập</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">Đăng ký</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
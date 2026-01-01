import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "../src/components/ui/sidebar";
import { StaffSidebar } from "../src/components/staff/StaffSidebar";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, User, ChevronDown } from "lucide-react";
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

interface StaffLayoutProps {
  children: ReactNode;
}

interface UserLocal {
  name?: string;
  fullname?: string;
  email?: string;
  avatar?: string;
  profileImage?: string;
}

export function StaffLayout({ children }: StaffLayoutProps) {
  const [user, setUser] = useState<UserLocal | null>(null);
  const navigate = useNavigate();

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...parsed,
          avatar: parsed.avatar || parsed.profileImage || "",
          name: parsed.name || parsed.fullname || parsed.email?.split("@")[0] || "Staff",
        });
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    const handleUpdate = () => loadUser();
    window.addEventListener("userUpdated", handleUpdate);
    return () => window.removeEventListener("userUpdated", handleUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/login");
  };

  const displayName =
    user?.name || user?.fullname || user?.email?.split("@")[0] || "Staff";

  const getInitials = (name: string) => {
    if (!name) return "S";
    return name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <StaffSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 flex h-15 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger />

            {/* Logo giống User */}
            <Link to="/staff" className="flex items-center gap-3">
              <div className="hidden sm:block leading-tight">
                <p className="font-bold">Du lịch Đà Nẵng</p>
                <p className="text-xs text-muted-foreground">Khu vực Staff</p>
              </div>
            </Link>

            {/* User dropdown bên phải */}
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 pr-3 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar || ""} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block font-medium">{displayName}</span>
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

                    {/* CHỈ có hồ sơ cá nhân */}
                    <DropdownMenuItem onClick={() => navigate("/staff/profile")}>
                      <User className="mr-2 h-4 w-4" /> Hồ sơ cá nhân
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
              )}
            </div>
          </div>

          {/* Nội dung */}
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}

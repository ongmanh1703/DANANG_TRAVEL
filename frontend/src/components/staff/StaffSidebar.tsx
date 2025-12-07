// src/components/staff/StaffSidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Utensils,
  MapPin,
  Newspaper,
  Calendar,
  LogOut,
  Plane,
  Star,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,

} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

const staffItems = [
  { title: 'Dashboard', url: '/staff', icon: LayoutDashboard },
  { title: 'Tours', url: '/staff/tours', icon: Compass },
  { title: 'Ẩm thực', url: '/staff/cuisine', icon: Utensils },
  { title: 'Khám phá', url: '/staff/destinations', icon: MapPin },
  { title: 'Tin tức', url: '/staff/news', icon: Newspaper },
  { title: 'Đặt tour', url: '/staff/bookings', icon: Calendar },
  { title: 'Đánh giá', url: '/staff/reviews', icon: Star },
];

export function StaffSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    toast({
      title: "Đăng xuất thành công",
    });
    navigate('/');
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sidebar-foreground">Staff Panel</h2>
              <p className="text-xs text-muted-foreground">Đà Nẵng Tourism</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý nội dung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staffItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  {!collapsed && <span>Đăng xuất</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-2 border-t border-sidebar-border">
        <SidebarTrigger className="w-full" />
      </div>
    </Sidebar>
  );
}
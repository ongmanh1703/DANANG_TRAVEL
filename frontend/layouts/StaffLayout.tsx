import { ReactNode, useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "../src/components/ui/sidebar";
import { StaffSidebar } from "../src/components/admin/StaffSidebar";

interface StaffLayoutProps {
  children: ReactNode;
}

interface User {
  name: string;
  avatar?: string;
}

export function StaffLayout({ children }: StaffLayoutProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Lấy thông tin user từ localStorage (giống AdminLayout)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar dành cho Staff */}
        <StaffSidebar />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Header cố định giống hệt AdminLayout */}
          <div className="sticky top-0 z-10 flex h-15 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger />

            {/* Thông tin người dùng bên phải */}
            <div className="ml-auto flex items-center gap-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium">
                {user?.name || 'Staff'}
              </span>
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
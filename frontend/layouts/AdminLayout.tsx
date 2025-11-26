import { ReactNode, useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "../src/components/ui/sidebar";
import { AdminSidebar } from "../src/components/admin/AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

interface User {
  name: string;
  avatar?: string;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Retrieve user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex h-15 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium">
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
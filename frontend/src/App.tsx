// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import Tours from "./pages/Tours";
import About from "./pages/About";
import Cuisine from "./pages/Cuisine";
import News from "./pages/News";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import DestinationDetail from "./pages/DestinationDetail";
import BookTour from "./pages/BookTour";
import DishDetail from "./pages/DishDetail";
import NewsDetail from "./pages/NewsDetail";
import MyBookings from "./pages/MyBookings";
import Payment from "./pages/Payment";
import ProfilePage from "./pages/Profile";   // ĐÃ THÊM

// Layout
import { AdminLayout } from "../layouts/AdminLayout";
import { StaffLayout } from "../layouts/StaffLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminDestinations from "./pages/admin/Destinations";
import AdminTours from "./pages/admin/Tours";
import AdminCuisine from "./pages/admin/Cuisine";
import AdminNews from "./pages/admin/News";
import AdminBookings from "./pages/admin/Bookings";
import AdminReviews from "./pages/admin/Reviews";

// Staff Pages
import StaffDashboard from "./pages/staff/Dashboard";
import StaffTours from "./pages/staff/Tours";
import StaffCuisine from "./pages/staff/Cuisine";
import StaffDestinations from "./pages/staff/Destinations";
import StaffNews from "./pages/staff/News";
import StaffBookings from "./pages/staff/Bookings";
import StaffReviews from "./pages/staff/Reviews";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// Component bảo vệ route (chỉ user đã login mới vào được)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/destinations" element={<Explore />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/cuisine" element={<Cuisine />} />
          <Route path="/cuisine/:id" element={<DishDetail />} />

          {/* Booking & User - Public */}
          <Route path="/book-tour/:id" element={<BookTour />} />
          <Route path="/payment/:bookingId" element={<Payment />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ==================== USER PROTECTED ROUTES ==================== */}
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ==================== ADMIN PANEL ==================== */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/destinations" element={<AdminLayout><AdminDestinations /></AdminLayout>} />
          <Route path="/admin/tours" element={<AdminLayout><AdminTours /></AdminLayout>} />
          <Route path="/admin/cuisine" element={<AdminLayout><AdminCuisine /></AdminLayout>} />
          <Route path="/admin/news" element={<AdminLayout><AdminNews /></AdminLayout>} />
          <Route path="/admin/bookings" element={<AdminLayout><AdminBookings /></AdminLayout>} />
          <Route path="/admin/reviews" element={<AdminLayout><AdminReviews /></AdminLayout>} />

          {/* ==================== STAFF PANEL ==================== */}
          <Route path="/staff" element={<StaffLayout><StaffDashboard /></StaffLayout>} />
          <Route path="/staff/tours" element={<StaffLayout><StaffTours /></StaffLayout>} />
          <Route path="/staff/cuisine" element={<StaffLayout><StaffCuisine /></StaffLayout>} />
          <Route path="/staff/destinations" element={<StaffLayout><StaffDestinations /></StaffLayout>} />
          <Route path="/staff/news" element={<StaffLayout><StaffNews /></StaffLayout>} />
          <Route path="/staff/bookings" element={<StaffLayout><StaffBookings /></StaffLayout>} />
          <Route path="/staff/reviews" element={<StaffLayout><StaffReviews /></StaffLayout>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
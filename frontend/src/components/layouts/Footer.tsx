import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  const quickLinks = [
    { label: "Giới thiệu", href: "/about" },
    { label: "Khám phá", href: "/destinations" },
    { label: "Tour du lịch", href: "/tours" },
    { label: "Ẩm thực", href: "/cuisine" },
    { label: "Tin tức", href: "/news" },
  ];

  const services = [
    { label: "Đặt tour", href: "/book-tour" },
    { label: "Ẩm thực", href: "/cuisine" },
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted/20 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Newsletter Section */}
        <div className="hero-gradient rounded-2xl p-8 mb-12">
          <div className="text-center text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Đăng ký nhận thông tin du lịch mới nhất
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Nhận những ưu đãi hấp dẫn, tour mới và cẩm nang du lịch thú vị từ
              chúng tôi
            </p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center overflow-hidden">
                <img
                  src={logo}
                  alt="Logo Đà Nẵng Travel"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Du lịch Đà Nẵng</h3>
                <p className="text-sm text-muted-foreground">
                  Thành phố đáng sống
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Chúng tôi cam kết mang đến những trải nghiệm du lịch tuyệt vời
              nhất tại Đà Nẵng và các vùng lân cận. Với đội ngũ chuyên nghiệp và
              dịch vụ tận tâm.
            </p>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Nguyễn Văn Linh, Quận Thanh Khê, Đà Nẵng</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>+84 236 3888 888</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@danangtravel.vn</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2">
              {services.map((service, index) => (
                <li key={index}>
                  <Link
                    to={service.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <div className="flex items-center space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-primary"
                >
                  <Facebook className="h-5 w-5" />
                </Button>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-primary"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-primary"
                >
                  <Youtube className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
        <Separator className="mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2025 Du lịch Đà Nẵng. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

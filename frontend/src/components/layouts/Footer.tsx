import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";
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
      {/* ICON RUNG */}
      <style>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          5% { transform: rotate(15deg); }
          10% { transform: rotate(-15deg); }
          15% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          25% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .icon-ring {
          animation: ring 2.5s infinite;
          transform-origin: center;
        }
      `}</style>

      <div className="container mx-auto px-4">
        {/* MAIN FOOTER */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* COMPANY */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden">
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
              nhất tại Đà Nẵng và các vùng lân cận.
            </p>

            <div className="space-y-3 text-sm">
              {/* ĐỊA CHỈ – RUNG – KHÔNG CLICK */}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary icon-ring" />
                <span>123 Nguyễn Như Đỗ, Phường Cẩm Lệ, Đà Nẵng</span>
              </div>

              {/* MAIL – RUNG – KHÔNG CLICK */}
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary icon-ring" />
                <span>infodanangtravel@gmail.com</span>
              </div>

              {/* PHONE – RUNG – KHÔNG CLICK */}
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary icon-ring" />
                <span>+84 798 283 079</span>
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SERVICES */}
          <div>
            <h4 className="font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2">
              {services.map((s, idx) => (
                <li key={idx}>
                  <Link
                    to={s.href}
                    className="text-muted-foreground hover:text-primary text-sm"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SOCIAL ICONS */}
          <div className="flex flex-col items-center space-y-3">
            {/* ICONS */}
            <div className="flex items-center space-x-6">
              <a
                href="https://www.facebook.com/share/17qVHP3QDu/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon">
                  <Facebook className="h-5 w-5" />
                </Button>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon">
                  <Instagram className="h-5 w-5" />
                </Button>
              </a>

              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=infodanangtravel@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon">
                  <Mail className="h-5 w-5" />
                </Button>
              </a>
            </div>

            {/* TEXT EFFECT */}
            <style>{`
              @keyframes textBlink {
                0% { opacity: 1; }
                50% { opacity: 0.4; }
                100% { opacity: 1; }
              }
              .blink-text {
                animation: textBlink 1.6s infinite ease-in-out;
              }
            `}</style>

            <p className="text-sm text-primary font-semibold blink-text text-center flex items-center gap-2">
              <span className="text-pink-500">📩</span>
              Hãy liên hệ với chúng tôi nếu bạn cần hỗ trợ!
            </p>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="text-sm text-muted-foreground text-center">
          © 2025 Du lịch Đà Nẵng. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

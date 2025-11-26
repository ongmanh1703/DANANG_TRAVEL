import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Users, MapPin } from 'lucide-react';
import Bgvideo from '../assets/bg-video-home.mp4'; 
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Hero = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập hay chưa bằng token
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Lắng nghe sự thay đổi storage (khi đăng nhập hoặc đăng xuất)
    const handleStorageChange = () => {
      const updatedToken = localStorage.getItem('token');
      setIsLoggedIn(!!updatedToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleExploreClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Nếu đã đăng nhập, chuyển tới trang khám phá
      navigate('/destinations');
    } else {
      // Nếu chưa đăng nhập, chuyển tới trang login
      navigate('/login');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          src={Bgvideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Khám phá
            <span className="block text-transparent bg-gradient-to-r from-sunset to-tropical bg-clip-text">
              Đà Nẵng
            </span>
          </h1>
          
          <p className="text-xl md:text-3xl mb-9 text-gray-100 leading-relaxed">
            Thành phố của những cây cầu, bãi biển tuyệt đẹp và ẩm thực phong phú.
            <br />
            Hãy để chúng tôi đưa bạn đến những trải nghiệm khó quên!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="hero-gradient hover:opacity-100 text-white font-semibold px-9"
              onClick={handleExploreClick}
            >
              Khám phá ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

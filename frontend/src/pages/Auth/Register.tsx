import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const Register = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp');
      setLoading(false);
      return;
    }

    try {
      const { fullname, email, phone, password } = formData;
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: fullname,
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/'); // Chuyển về trang chủ sau khi đăng ký thành công
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/10 flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-2xl border border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardTitle className="text-2xl text-center font-bold text-foreground">
              Tạo tài khoản mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-sm font-medium">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullname" 
                    type="text" 
                    placeholder="Nhập họ và tên"
                    className="pl-10 border-primary/30 focus:ring-2 focus:ring-primary"
                    value={formData.fullname}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Nhập email"
                    className="pl-10 border-primary/30 focus:ring-2 focus:ring-primary"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="Nhập số điện thoại"
                    className="pl-10 border-primary/30 focus:ring-2 focus:ring-primary"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Nhập mật khẩu"
                    className="pl-10 pr-10 border-primary/30 focus:ring-2 focus:ring-primary"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-primary/10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10 pr-10 border-primary/30 focus:ring-2 focus:ring-primary"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-primary/10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 transition-all" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </Button>
            </form>

            {/* 👉 Thêm đoạn này */}
            <p className="text-center text-sm text-muted-foreground">
              Bạn đã có tài khoản?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Đăng nhập ngay
              </Link>
            </p>

            <Button asChild variant="ghost" className="w-full text-primary hover:text-primary/80 hover:bg-primary/10">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại trang chủ
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Register;

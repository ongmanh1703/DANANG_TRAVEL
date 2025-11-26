import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft } from 'lucide-react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setSuccess('Mã đặt lại mật khẩu đã được gửi đến email hoặc số điện thoại của bạn.');
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi gửi mã đặt lại');
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
              Quên mật khẩu?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <p className="text-center text-muted-foreground text-sm">
              Nhập email hoặc số điện thoại để nhận mã đặt lại mật khẩu
            </p>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email hoặc số điện thoại</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="reset-email" 
                    type="text" 
                    placeholder="Nhập email hoặc SĐT"
                    className="pl-10 border-primary/30 focus:ring-2 focus:ring-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 transition-all"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi mã đặt lại'}
              </Button>
            </form>
            <Button asChild variant="ghost" className="w-full text-primary hover:text-primary/80 hover:bg-primary/10">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại đăng nhập
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ForgotPassword;
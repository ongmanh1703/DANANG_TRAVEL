import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Award } from 'lucide-react';
import Gioithieu from '../assets/bg-header-about.jpg';
import Danang from '../assets/anh-da-nang-ve-dem.jpg';
import Connguoi from '../assets/van-hoa-con-nguoi-da-nang.jpg';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 z-10" />
          <div className="absolute inset-0">
            <img
              src={Gioithieu}
              alt="Đà Nẵng"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-20 text-center text-white">
            <Badge className="mb-4 hero-gradient text-white">Về Đà Nẵng</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Thành phố đáng sống
            </h1>
            <p className="text-xl max-w-2xl mx-auto">
              Khám phá vẻ đẹp tự nhiên, văn hóa phong phú và con người thân thiện của Đà Nẵng
            </p>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Đà Nẵng - <span className="text-primary">Thành phố đáng sống nhất Việt Nam</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 text-justify">
                  Đà Nẵng là một trong sáu thành phố trực thuộc trung ương của Việt Nam, nằm tại khu vực Duyên hải Nam Trung Bộ. Đây là thành phố có diện tích lớn nhất của Việt Nam, đóng vai trò là trung tâm chính trị, kinh tế - xã hội lớn của miền Trung và là hạt nhân quan trọng trong Vùng kinh tế trọng điểm miền Trung. Thành phố Đà Nẵng hiện là đô thị loại I, là thành phố trung tâm cấp vùng và cấp quốc gia.
                  Về mặt địa lý, Đà Nẵng nằm ở trung độ của Việt Nam, có vị trí trọng yếu cả về kinh tế – xã hội và quốc phòng – an ninh với vai trò cực tăng trưởng quốc gia là trung tâm công nghiệp, tài chính, du lịch, dịch vụ, văn hóa, giáo dục, y tế, khoa học, công nghệ, khởi nghiệp, đổi mới sáng tạo của khu vực Miền Trung, Tây Nguyên và cả nước; trung tâm tổ chức các sự kiện tầm khu vực và quốc tế. Đà Nẵng cũng là đô thị biển và đầu mối giao thông rất quan trọng về đường bộ, đường sắt, đường biển và đường hàng không.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Diện tích: 1,285 km²</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Dân số: 1.2 triệu người</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Thành lập: 1997</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span>Thành phố xanh</span>
                  </div>
                </div>
                <Button className="hero-gradient text-white">Khám phá ngay</Button>
              </div>
              <div className="relative">
                <img
                  src={Danang}
                  alt="Đà Nẵng cityscape"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* People & Culture */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img
                  src={Connguoi}
                  alt="People of Da Nang"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-4xl font-bold mb-6">
                  Con người <span className="text-primary">Đà Nẵng</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 text-justify">
                  Người Đà Nẵng nổi tiếng với lòng hiếu khách, sự thân thiện và gần gũi. 
                  Họ luôn chào đón du khách với nụ cười ấm áp và sẵn sàng chia sẻ những câu chuyện 
                  thú vị về quê hương mình.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Thân thiện, hiếu khách</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Bảo tồn văn hóa truyền thống</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Tinh thần đoàn kết, tương trợ</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Năng động, sáng tạo</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* History & Culture */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 sunset-gradient text-white">Lịch sử & Văn hóa</Badge>
              <h2 className="text-4xl font-bold mb-4">
                Bề dày <span className="text-secondary">lịch sử</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Vị trí địa lý</h3>
                  <p className="text-muted-foreground text-justify">
                    Thành phố Đà Nẵng phía Bắc giáp tỉnh thành phố Huế, phía Tây và Nam giáp tỉnh Quảng Nam, phía đông giáp biển Đông. Trung tâm thành phố cách thủ đô Hà Nội 764km về phía Bắc, cách Thành phố Hồ Chí Minh 964km về phía Nam, cách thành phố Huế 108km về hướng Tây Bắc. Đây là một thành phố vừa có núi cao, sông sâu, đồi dốc trung du xen kẽ vùng đồng bằng ven biển hẹp.
                    Đà Nẵng nằm ở trung độ của Việt Nam, trên trục giao thông huyết mạch Bắc Nam về cả đường bộ, đường sắt, đường biển và đường hàng không, là cửa ngõ giao thông quan trọng của cả miền Trung và Tây Nguyên, là điểm cuối của hành lang kinh tế Đông Tây đi qua các nước Myanma, Lào, Thái Lan, Việt Nam.
                    Thành phố Đà Nẵng nằm trong vùng khí hậu nhiệt đới gió mùa điển hình, nhiệt độ cao và ít biến động. Khí hậu Đà Nẵng là nơi chuyển tiếp đan xen giữa khí hậu cận nhiệt đới ở miền Bắc và nhiệt đới xavan ở miền Nam, với tính trội là khí hậu nhiệt đới ở phía Nam. Mỗi năm có 2 mùa rõ rệt: mùa mưa từ tháng 9 đến tháng 12 và mùa khô từ tháng 1 đến tháng 8, thỉnh thoảng có những đợt rét mùa đông nhưng không đậm và không kéo dài.
                    Nhiệt độ trung bình hàng năm khoảng 25,8 °C; cao nhất vào các tháng 6, 7, 8, trung bình 28-30 °C; thấp nhất vào các tháng 12, 1, 2, trung bình 18-23 °C. Riêng vùng rừng núi Bà Nà ở độ cao gần 1.500 m, nhiệt độ trung bình khoảng 20 °C.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Thời Pháp thuộc</h3>
                  <p className="text-muted-foreground text-justify">
                    Năm 1858, cuộc xâm lược của Pháp tại Việt Nam khởi đầu bằng cuộc tấn công vào Đà Nẵng.
                    Ngày 25/8/1883, triều đình Huế buộc phải ký với Pháp Hiệp ước Harmand. Theo điều 6 và 7 của Hiệp ước này, ngoài việc yêu cầu mở cửa Đà Nẵng để thông thương còn quy định rằng Pháp sẽ được phép lập các khu nhượng địa ở đây.
                    Ngày 1/7/1884, thực dân Pháp chính thức thiết lập khu nhượng địa Đà Nẵng. Khu nhượng địa này bao gồm cảng Đà Nẵng và một số vùng phụ cận, có diện tích khoảng 30 ha, nằm ở phía đông bắc bán đảo Sơn Trà ngày nay.
                    Sau khi thành lập Liên bang Đông Dương thì Pháp tách Đà Nẵng khỏi Quảng Nam với tính cách là một nhượng địa (concession) và đổi tên thành Tourane. Đơn vị hành chính này chịu sự cai quản trực tiếp của Toàn quyền Đông Dương thay vì triều đình Huế – tuy thị trấn này nằm trong xứ Trung Kỳ.
                    Đầu thế kỷ 20, Tourane được Pháp xây dựng thành một đô thị hiện đại theo kiểu Tây phương. Cơ sở hạ tầng xã hội và kỹ thuật sản xuất được đầu tư mạnh mẽ, các ngành nghề sản xuất và kinh doanh phát triển nhanh chóng, biến Tourane thành một trong ba trung tâm thương mại quan trọng nhất cả nước, cùng với Hải Phòng và Sài Gòn.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Đà Nẵng hiện đại</h3>
                  <p className="text-muted-foreground text-justify">
                    Ngày nay, Đà Nẵng là thành phố năng động, hiện đại nhưng vẫn giữ được những giá trị văn hóa truyền thống quý báu.
                    Đà Nẵng là một trong sáu thành phố trực thuộc trung ương của Việt Nam, nằm tại khu vực Duyên hải Nam Trung Bộ. Đây là thành phố có diện tích lớn nhất của Việt Nam, đóng vai trò là trung tâm chính trị, kinh tế - xã hội lớn của miền Trung và là hạt nhân quan trọng trong Vùng kinh tế trọng điểm miền Trung. Thành phố Đà Nẵng hiện là đô thị loại I, là thành phố trung tâm cấp vùng và cấp quốc gia.
                    Về mặt địa lý, Đà Nẵng nằm ở trung độ của Việt Nam, có vị trí trọng yếu cả về kinh tế – xã hội và quốc phòng – an ninh với vai trò cực tăng trưởng quốc gia là trung tâm công nghiệp, tài chính, du lịch, dịch vụ, văn hóa, giáo dục, y tế, khoa học, công nghệ, khởi nghiệp, đổi mới sáng tạo của khu vực Miền Trung, Tây Nguyên và cả nước; trung tâm tổ chức các sự kiện tầm khu vực và quốc tế. Đà Nẵng cũng là đô thị biển và đầu mối giao thông rất quan trọng về đường bộ, đường sắt, đường biển và đường hàng không.
                    Trong những năm gần đây, Đà Nẵng tích cực đầu tư xây dựng cơ sở hạ tầng, cải thiện môi trường, nâng cao an sinh xã hội và được đánh giá là thành phố đáng sống nhất Việt Nam. Năm 2018, Đà Nẵng được chọn đại diện cho Việt Nam lọt vào danh sách 10 địa điểm tốt nhất để sống ở nước ngoài do tạp chí du lịch Live and Invest Overseas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      <section className="py-20 bg-muted/10">
      <div className="container mx-auto px-4 text-center">
        <Badge className="mb-4 hero-gradient text-white">Video giới thiệu</Badge>
        <h2 className="text-4xl font-bold mb-8">
          Khám phá vẻ đẹp <span className="text-primary">Đà Nẵng</span> qua video
        </h2>
        {/* khung video lớn, cân đối */}
        <div className="relative w-full max-w-6xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/BEbtetdpJ4g?rel=0&modestbranding=1&playsinline=1"
            title="Giới thiệu Đà Nẵng"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        </div>
       </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;

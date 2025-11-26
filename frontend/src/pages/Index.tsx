import Header from '@/components/layouts/Header';
import Hero from '@/components/Hero';
import FeaturedDestinations from '@/components/FeaturedDestinations';
import FeaturedTours from '@/components/FeaturedTours';
import CuisineSection from '@/components/CuisineSection';
import Footer from '@/components/layouts/Footer';
import ChatBubble from '@/components/ChatBubble';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeaturedDestinations />
        <FeaturedTours />
        <CuisineSection />
      </main>
      <Footer />
      <ChatBubble />
    </div>
  );
};

export default Index;
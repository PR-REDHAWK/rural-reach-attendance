import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { HeroButton } from '@/components/ui/hero-button';
import { School, Users, BarChart3, Camera, Smartphone, Shield } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <div className="text-center">
          <div className="w-16 h-16 gradient-warm rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">लोड हो रहा है... / Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (user && profile) {
    return <TeacherDashboard />;
  }

  // Show auth form if not authenticated but trying to access protected content
  if (!user) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/60"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
            <div className="mb-8">
              <div className="w-20 h-20 gradient-warm rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <School className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                <span className="block">ग्रामीण शिक्षा</span>
                <span className="block text-2xl md:text-4xl font-normal opacity-90">
                  Rural Education Platform
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                स्मार्ट उपस्थिति प्रबंधन प्रणाली / Smart Attendance Management System
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <HeroButton size="xl" className="text-white shadow-glow">
                <Users className="w-6 h-6 mr-3" />
                शिक्षक लॉगिन / Teacher Login
              </HeroButton>
              
              <HeroButton variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-primary">
                <BarChart3 className="w-6 h-6 mr-3" />
                प्रशासक पैनल / Admin Panel
              </HeroButton>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 gradient-subtle">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                विशेषताएं / Features
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                ग्रामीण भारत के लिए बनाया गया / Built for Rural India
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-xl bg-card shadow-card hover:shadow-warm transition-smooth">
                <div className="w-16 h-16 gradient-sunrise rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">चेहरा पहचान / Face Recognition</h3>
                <p className="text-muted-foreground">
                  स्वचालित उपस्थिति के लिए AI आधारित चेहरा पहचान / AI-powered face recognition for automatic attendance
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card shadow-card hover:shadow-warm transition-smooth">
                <div className="w-16 h-16 gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">मोबाइल फ्रेंडली / Mobile Friendly</h3>
                <p className="text-muted-foreground">
                  किसी भी डिवाइस पर काम करता है / Works on any device, optimized for rural connectivity
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card shadow-card hover:shadow-warm transition-smooth">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">ऑफलाइन सपोर्ट / Offline Support</h3>
                <p className="text-muted-foreground">
                  इंटरनेट कनेक्शन के बिना भी काम करता है / Works even without internet connection
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              आज से शुरू करें / Get Started Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              शिक्षा में क्रांति लाएं / Transform Education in Rural India
            </p>
            
            <div className="max-w-md mx-auto">
              <AuthForm />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return <AuthForm />;
};

export default Index;

import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  LogOut, 
  Shield 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { profile, loading, signOut, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!profile || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [profile, isAdmin, loading, navigate]);

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

  if (!profile || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'डैशबोर्ड / Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'कक्षावार उपस्थिति / Class Attendance', href: '/admin/classes', icon: BookOpen },
    { name: 'छात्र ट्रैकिंग / Student Tracking', href: '/admin/students', icon: Users },
    { name: 'रिपोर्ट / Reports', href: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-warm rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">प्रशासक पैनल / Admin Panel</h1>
              <p className="text-sm text-muted-foreground">{profile.name}</p>
            </div>
          </div>
          
          <div className="ml-auto">
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              लॉगआउट / Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card/30 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendance: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id');
      
      if (studentsError) throw studentsError;

      // Get total teachers
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher');
      
      if (teachersError) throw teachersError;

      // Get unique classes
      const { data: classes, error: classesError } = await supabase
        .from('students')
        .select('class')
        .not('class', 'is', null);
      
      if (classesError) throw classesError;
      
      const uniqueClasses = new Set(classes?.map(c => c.class)).size;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);
      
      if (attendanceError) throw attendanceError;

      const totalAttendanceToday = todayAttendance?.length || 0;
      const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const attendancePercentage = totalAttendanceToday > 0 ? 
        Math.round((presentToday / totalAttendanceToday) * 100) : 0;

      setStats({
        totalStudents: students?.length || 0,
        totalTeachers: teachers?.length || 0,
        totalClasses: uniqueClasses,
        todayAttendance: attendancePercentage
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'कुल छात्र / Total Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'सभी पंजीकृत छात्र / All registered students'
    },
    {
      title: 'कुल शिक्षक / Total Teachers',
      value: stats.totalTeachers,
      icon: GraduationCap,
      description: 'सक्रिय शिक्षक / Active teachers'
    },
    {
      title: 'कुल कक्षाएं / Total Classes',
      value: stats.totalClasses,
      icon: BookOpen,
      description: 'विभिन्न कक्षाएं / Different classes'
    },
    {
      title: 'आज की उपस्थिति / Today\'s Attendance',
      value: `${stats.todayAttendance}%`,
      icon: TrendingUp,
      description: 'आज का उपस्थिति प्रतिशत / Today\'s attendance percentage'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">डैशबोर्ड अवलोकन / Dashboard Overview</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">डैशबोर्ड अवलोकन / Dashboard Overview</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('hi-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="hover:shadow-glow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <CardDescription className="text-xs">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>हाल की गतिविधि / Recent Activity</CardTitle>
            <CardDescription>
              पिछले 7 दिनों का सारांश / Summary of last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              गतिविधि डेटा लोड हो रहा है... / Activity data loading...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>त्वरित कार्य / Quick Actions</CardTitle>
            <CardDescription>
              सामान्य प्रशासनिक कार्य / Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <button className="text-left p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-medium">छात्र रिपोर्ट निर्यात करें / Export Student Reports</div>
                <div className="text-sm text-muted-foreground">सभी छात्र डेटा डाउनलोड करें</div>
              </button>
              <button className="text-left p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-medium">उपस्थिति सारांश / Attendance Summary</div>
                <div className="text-sm text-muted-foreground">आज की उपस्थिति देखें</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeroButton } from '@/components/ui/hero-button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FaceScanDialog } from '@/components/face/FaceScanDialog';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  Clock,
  UserPlus,
  Camera,
  BookOpen,
  TrendingUp,
  LogOut
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  roll_number: string;
  class: string;
  section?: string;
  photo_url?: string;
  face_descriptor?: number[];
  face_enrolled_at?: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late';
}

export const TeacherDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayAttendanceExists, setTodayAttendanceExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faceScanOpen, setFaceScanOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    checkTodayAttendance();
  }, [profile]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', profile?.assigned_class || '')
        .order('roll_number');

      if (error) throw error;
      
      setStudents((data || []).map(student => ({
        ...student,
        face_descriptor: student.face_descriptor as number[] | undefined
      })));
      // Initialize attendance with all students present by default
      setAttendance(
        data?.map(student => ({
          student_id: student.id,
          status: 'present' as const
        })) || []
      );
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "त्रुटि / Error",
        description: "छात्रों की जानकारी लोड नहीं हो सकी / Could not load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', today)
        .limit(1);

      if (error) throw error;
      setTodayAttendanceExists((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => 
      prev.map(record => 
        record.student_id === studentId 
          ? { ...record, status }
          : record
      )
    );
  };

  const submitAttendance = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const attendanceRecords = attendance.map(record => ({
        student_id: record.student_id,
        teacher_id: profile?.user_id,
        date: today,
        status: record.status,
        marked_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,date',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "उपस्थिति सहेजी गई / Attendance Saved",
        description: "आज की उपस्थिति सफलतापूर्वक दर्ज की गई / Today's attendance recorded successfully",
      });
      
      setTodayAttendanceExists(true);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "त्रुटि / Error",
        description: "उपस्थिति सहेजने में त्रुटि / Error saving attendance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <div className="text-center">
          <div className="w-16 h-16 gradient-warm rounded-full animate-pulse mx-auto mb-4"></div>
          <p>लोड हो रहा है... / Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              नमस्ते, {profile?.name} / Hello, {profile?.name}
            </h1>
            <p className="text-muted-foreground">
              कक्षा / Class: {profile?.assigned_class || 'अनिर्दिष्ट / Unassigned'}
            </p>
          </div>
          <Button 
            onClick={signOut}
            variant="outline"
            className="transition-smooth hover:shadow-warm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            लॉग आउट / Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-xs text-muted-foreground">कुल छात्र / Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-secondary mr-3" />
                <div>
                  <p className="text-2xl font-bold text-secondary">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">उपस्थित / Present</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-accent mr-3" />
                <div>
                  <p className="text-2xl font-bold text-accent">{lateCount}</p>
                  <p className="text-xs text-muted-foreground">देर से / Late</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-destructive mr-3" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{absentCount}</p>
                  <p className="text-xs text-muted-foreground">अनुपस्थित / Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Taking */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  आज की उपस्थिति / Today's Attendance
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('hi-IN', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {students.map((student) => {
                        const studentAttendance = attendance.find(a => a.student_id === student.id);
                        return (
                          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {student.roll_number}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  रोल / Roll: {student.roll_number}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={studentAttendance?.status === 'present' ? 'default' : 'outline'}
                                onClick={() => updateAttendance(student.id, 'present')}
                                className="text-xs transition-smooth"
                              >
                                उप. / P
                              </Button>
                              <Button
                                size="sm"
                                variant={studentAttendance?.status === 'late' ? 'default' : 'outline'}
                                onClick={() => updateAttendance(student.id, 'late')}
                                className="text-xs transition-smooth"
                              >
                                देर / L
                              </Button>
                              <Button
                                size="sm"
                                variant={studentAttendance?.status === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => updateAttendance(student.id, 'absent')}
                                className="text-xs transition-smooth"
                              >
                                अन. / A
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <HeroButton
                        onClick={submitAttendance}
                        disabled={isSubmitting}
                        className="w-full"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            सहेज रहे हैं... / Saving...
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-5 h-5 mr-2" />
                            उपस्थिति सहेजें / Save Attendance
                          </>
                        )}
                      </HeroButton>
                      
                      {todayAttendanceExists && (
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          आज की उपस्थिति पहले से दर्ज है / Today's attendance already recorded
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      कोई छात्र नहीं मिला / No students found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">त्वरित कार्य / Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <HeroButton
                  variant="secondary"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => setAddStudentOpen(true)}
                >
                  <UserPlus className="w-5 h-5 mr-3" />
                  नया छात्र जोड़ें / Add Student
                </HeroButton>
                
                <HeroButton
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => setFaceScanOpen(true)}
                >
                  <Camera className="w-5 h-5 mr-3" />
                  चेहरा स्कैन / Face Scan
                </HeroButton>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">आज का सारांश / Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">उपस्थिति दर / Attendance Rate</span>
                    <Badge variant="secondary">
                      {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="gradient-warm h-2 rounded-full transition-smooth"
                      style={{ 
                        width: students.length > 0 ? `${(presentCount / students.length) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <FaceScanDialog
        isOpen={faceScanOpen}
        onClose={() => setFaceScanOpen(false)}
        students={students}
        onMarkAttendance={updateAttendance}
        attendanceMarked={new Set(attendance.map(a => a.student_id))}
      />
      
      <AddStudentDialog
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onStudentAdded={fetchStudents}
      />
    </div>
  );
};
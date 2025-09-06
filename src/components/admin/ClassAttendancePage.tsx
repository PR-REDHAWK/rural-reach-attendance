import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ClassAttendanceData {
  className: string;
  teacherName: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendancePercentage: number;
}

export const ClassAttendancePage = () => {
  const [classData, setClassData] = useState<ClassAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassAttendanceData();
  }, []);

  const fetchClassAttendanceData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all unique classes with their teachers
      const { data: classTeachers, error: classError } = await supabase
        .from('profiles')
        .select('name, assigned_class')
        .eq('role', 'teacher')
        .not('assigned_class', 'is', null);
      
      if (classError) throw classError;

      const classAttendanceData: ClassAttendanceData[] = [];

      for (const teacher of classTeachers || []) {
        if (!teacher.assigned_class) continue;

        // Get total students in this class
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id')
          .eq('class', teacher.assigned_class);
        
        if (studentsError) continue;

        const totalStudents = students?.length || 0;

        // Get today's attendance for this class
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('status, student_id')
          .eq('date', today)
          .in('student_id', students?.map(s => s.id) || []);
        
        if (attendanceError) continue;

        const presentToday = attendance?.filter(a => a.status === 'present').length || 0;
        const absentToday = attendance?.filter(a => a.status === 'absent').length || 0;
        const attendancePercentage = totalStudents > 0 ? 
          Math.round(((presentToday) / totalStudents) * 100) : 0;

        classAttendanceData.push({
          className: teacher.assigned_class,
          teacherName: teacher.name,
          totalStudents,
          presentToday,
          absentToday: totalStudents - presentToday,
          attendancePercentage
        });
      }

      setClassData(classAttendanceData);
    } catch (error) {
      console.error('Error fetching class attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Class Name', 'Teacher Name', 'Total Students', 'Present Today', 'Absent Today', 'Attendance %'];
    const csvContent = [
      headers.join(','),
      ...classData.map(row => [
        row.className,
        row.teacherName,
        row.totalStudents,
        row.presentToday,
        row.absentToday,
        row.attendancePercentage
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">कक्षावार उपस्थिति / Class-wise Attendance</h1>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">कक्षावार उपस्थिति / Class-wise Attendance</h1>
          <p className="text-muted-foreground">
            आज की तारीख: {new Date().toLocaleDateString('hi-IN')} / Today: {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            CSV निर्यात / Export CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            PDF निर्यात / Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>कक्षा उपस्थिति सारांश / Class Attendance Summary</CardTitle>
          <CardDescription>
            सभी कक्षाओं की आज की उपस्थिति / Today's attendance across all classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              कोई डेटा उपलब्ध नहीं है / No data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>कक्षा / Class Name</TableHead>
                  <TableHead>शिक्षक / Teacher Name</TableHead>
                  <TableHead>कुल छात्र / Total Students</TableHead>
                  <TableHead>उपस्थित / Present Today</TableHead>
                  <TableHead>अनुपस्थित / Absent Today</TableHead>
                  <TableHead>उपस्थिति % / Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.className}</TableCell>
                    <TableCell>{row.teacherName}</TableCell>
                    <TableCell>{row.totalStudents}</TableCell>
                    <TableCell className="text-green-600 font-medium">{row.presentToday}</TableCell>
                    <TableCell className="text-red-600 font-medium">{row.absentToday}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-sm font-medium ${
                          row.attendancePercentage >= 80 
                            ? 'bg-green-100 text-green-800' 
                            : row.attendancePercentage >= 60 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.attendancePercentage}%
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
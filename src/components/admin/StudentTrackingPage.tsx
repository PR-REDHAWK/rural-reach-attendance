import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, FileText, User } from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  class: string;
  roll_number: string;
  totalPresent: number;
  totalAbsent: number;
  attendancePercentage: number;
}

export const StudentTrackingPage = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const fetchStudentData = async () => {
    try {
      // Get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, name, class, roll_number');
      
      if (studentsError) throw studentsError;

      const studentAttendanceData: StudentData[] = [];

      for (const student of allStudents || []) {
        // Get attendance data for this student
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', student.id);
        
        if (attendanceError) continue;

        const totalPresent = attendance?.filter(a => a.status === 'present').length || 0;
        const totalAbsent = attendance?.filter(a => a.status === 'absent').length || 0;
        const totalDays = totalPresent + totalAbsent;
        const attendancePercentage = totalDays > 0 ? 
          Math.round((totalPresent / totalDays) * 100) : 0;

        studentAttendanceData.push({
          id: student.id,
          name: student.name,
          class: student.class,
          roll_number: student.roll_number,
          totalPresent,
          totalAbsent,
          attendancePercentage
        });
      }

      setStudents(studentAttendanceData);
      setFilteredStudents(studentAttendanceData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStudentReport = (student: StudentData) => {
    const reportContent = `
छात्र रिपोर्ट / Student Report
=================================

छात्र का नाम / Student Name: ${student.name}
कक्षा / Class: ${student.class}
रोल नंबर / Roll Number: ${student.roll_number}

उपस्थिति सारांश / Attendance Summary:
- कुल उपस्थित दिन / Total Present Days: ${student.totalPresent}
- कुल अनुपस्थित दिन / Total Absent Days: ${student.totalAbsent}
- उपस्थिति प्रतिशत / Attendance Percentage: ${student.attendancePercentage}%

रिपोर्ट जनरेट की गई / Report Generated: ${new Date().toLocaleString('hi-IN')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-report-${student.name}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAllStudents = () => {
    const headers = ['Name', 'Class', 'Roll Number', 'Total Present', 'Total Absent', 'Attendance %'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        student.name,
        student.class,
        student.roll_number,
        student.totalPresent,
        student.totalAbsent,
        student.attendancePercentage
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-students-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">छात्र उपस्थिति ट्रैकिंग / Student Attendance Tracking</h1>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              {[1, 2, 3, 4, 5].map((i) => (
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
          <h1 className="text-3xl font-bold">छात्र उपस्थिति ट्रैकिंग / Student Attendance Tracking</h1>
          <p className="text-muted-foreground">
            व्यक्तिगत छात्र उपस्थिति रिकॉर्ड / Individual student attendance records
          </p>
        </div>
        
        <Button onClick={exportAllStudents} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          सभी निर्यात करें / Export All
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="छात्र का नाम, रोल नंबर या कक्षा खोजें / Search by name, roll number, or class"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            छात्र सूची / Student List
          </CardTitle>
          <CardDescription>
            {filteredStudents.length} छात्र मिले / {filteredStudents.length} students found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'कोई छात्र नहीं मिला / No students found' : 'कोई डेटा उपलब्ध नहीं / No data available'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>नाम / Name</TableHead>
                  <TableHead>कक्षा / Class</TableHead>
                  <TableHead>रोल नंबर / Roll No.</TableHead>
                  <TableHead>उपस्थित दिन / Present Days</TableHead>
                  <TableHead>अनुपस्थित दिन / Absent Days</TableHead>
                  <TableHead>उपस्थिति % / Attendance %</TableHead>
                  <TableHead>कार्य / Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell className="text-green-600 font-medium">{student.totalPresent}</TableCell>
                    <TableCell className="text-red-600 font-medium">{student.totalAbsent}</TableCell>
                    <TableCell>
                      <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                        student.attendancePercentage >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : student.attendancePercentage >= 60 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.attendancePercentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateStudentReport(student)}
                        className="gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        रिपोर्ट / Report
                      </Button>
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
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, TrendingUp, BarChart3 } from 'lucide-react';

interface DailyAttendanceData {
  date: string;
  present: number;
  absent: number;
  percentage: number;
}

interface WeeklyData {
  week: string;
  averageAttendance: number;
}

interface MonthlyData {
  month: string;
  averageAttendance: number;
}

export const ReportsPage = () => {
  const [dailyData, setDailyData] = useState<DailyAttendanceData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // days

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily data for the selected period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod));
      
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');

      if (error) throw error;

      // Process daily data
      const dailyMap = new Map<string, { present: number; absent: number }>();
      
      attendanceData?.forEach(record => {
        const date = record.date;
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { present: 0, absent: 0 });
        }
        const dayData = dailyMap.get(date)!;
        if (record.status === 'present') {
          dayData.present++;
        } else if (record.status === 'absent') {
          dayData.absent++;
        }
      });

      const processedDailyData: DailyAttendanceData[] = Array.from(dailyMap.entries()).map(([date, data]) => {
        const total = data.present + data.absent;
        return {
          date: new Date(date).toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit' }),
          present: data.present,
          absent: data.absent,
          percentage: total > 0 ? Math.round((data.present / total) * 100) : 0
        };
      });

      setDailyData(processedDailyData);

      // Generate sample weekly and monthly data for demonstration
      setWeeklyData([
        { week: 'सप्ताह 1', averageAttendance: 85 },
        { week: 'सप्ताह 2', averageAttendance: 78 },
        { week: 'सप्ताह 3', averageAttendance: 92 },
        { week: 'सप्ताह 4', averageAttendance: 87 },
      ]);

      setMonthlyData([
        { month: 'जनवरी', averageAttendance: 82 },
        { month: 'फरवरी', averageAttendance: 85 },
        { month: 'मार्च', averageAttendance: 79 },
        { month: 'अप्रैल', averageAttendance: 88 },
      ]);

    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportDailyReport = () => {
    const headers = ['Date', 'Present', 'Absent', 'Attendance %'];
    const csvContent = [
      headers.join(','),
      ...dailyData.map(row => [
        row.date,
        row.present,
        row.absent,
        row.percentage
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportWeeklyReport = () => {
    const headers = ['Week', 'Average Attendance %'];
    const csvContent = [
      headers.join(','),
      ...weeklyData.map(row => [
        row.week,
        row.averageAttendance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">रिपोर्ट / Reports</h1>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">रिपोर्ट / Reports</h1>
          <p className="text-muted-foreground">
            उपस्थिति के रुझान और विश्लेषण / Attendance trends and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="अवधि चुनें / Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">पिछले 7 दिन / Last 7 days</SelectItem>
              <SelectItem value="14">पिछले 14 दिन / Last 14 days</SelectItem>
              <SelectItem value="30">पिछले 30 दिन / Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="w-4 h-4" />
            दैनिक / Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            साप्ताहिक / Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            मासिक / Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>दैनिक उपस्थिति रिपोर्ट / Daily Attendance Report</CardTitle>
                <CardDescription>
                  पिछले {selectedPeriod} दिनों का दैनिक उपस्थिति सारांश / Daily attendance summary for last {selectedPeriod} days
                </CardDescription>
              </div>
              <Button onClick={exportDailyReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                निर्यात / Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      value, 
                      name === 'present' ? 'उपस्थित / Present' : 
                      name === 'absent' ? 'अनुपस्थित / Absent' : 
                      'प्रतिशत / Percentage'
                    ]}
                  />
                  <Bar dataKey="present" fill="#22c55e" name="present" />
                  <Bar dataKey="absent" fill="#ef4444" name="absent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>साप्ताहिक उपस्थिति रुझान / Weekly Attendance Trends</CardTitle>
                <CardDescription>
                  साप्ताहिक औसत उपस्थिति प्रतिशत / Weekly average attendance percentage
                </CardDescription>
              </div>
              <Button onClick={exportWeeklyReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                निर्यात / Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'औसत उपस्थिति / Average Attendance']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageAttendance" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>मासिक उपस्थिति रुझान / Monthly Attendance Trends</CardTitle>
                <CardDescription>
                  मासिक औसत उपस्थिति प्रतिशत / Monthly average attendance percentage
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                निर्यात / Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'औसत उपस्थिति / Average Attendance']}
                  />
                  <Bar dataKey="averageAttendance" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
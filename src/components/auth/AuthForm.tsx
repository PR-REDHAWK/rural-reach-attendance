import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, School, Users, GraduationCap } from 'lucide-react';

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            role: 'teacher'
          }
        }
      });

      if (error) {
        toast({
          title: "साइन अप त्रुटि / Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "साइन अप सफल / Sign Up Successful",
          description: "कृपया अपना ईमेल चेक करें / Please check your email to confirm your account",
        });
      }
    } catch (error) {
      toast({
        title: "त्रुटि / Error",
        description: "कुछ गलत हुआ है / Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "लॉगिन त्रुटि / Login Error", 
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "लॉगिन सफल / Login Successful",
          description: "स्वागत है / Welcome back!",
        });
      }
    } catch (error) {
      toast({
        title: "त्रुटि / Error",
        description: "कुछ गलत हुआ है / Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 gradient-warm rounded-full flex items-center justify-center mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">ग्रामीण शिक्षा / Rural Education</CardTitle>
          <CardDescription>
            उपस्थिति प्रबंधन प्रणाली / Attendance Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                लॉगिन / Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                साइन अप / Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">ईमेल / Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="teacher@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-smooth focus:shadow-warm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">पासवर्ड / Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-smooth focus:shadow-warm"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-sunrise hover:shadow-glow transition-spring hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  लॉगिन करें / Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">नाम / Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="आपका नाम / Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="transition-smooth focus:shadow-warm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">ईमेल / Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="teacher@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-smooth focus:shadow-warm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">पासवर्ड / Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-smooth focus:shadow-warm"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-warm hover:shadow-glow transition-spring hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  शिक्षक के रूप में साइन अप / Sign Up as Teacher
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
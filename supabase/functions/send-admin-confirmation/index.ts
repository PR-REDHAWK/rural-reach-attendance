import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminConfirmationRequest {
  email: string;
  name: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, confirmationUrl }: AdminConfirmationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Admin Portal <onboarding@resend.dev>",
      to: [email],
      subject: "Confirm your Admin Account - Rural Education Attendance System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🛡️ Admin Account Confirmation</h1>
            <p style="color: #64748b; font-size: 16px;">Rural Education Attendance Management System</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">नमस्ते ${name}! / Hello ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">
              आपका प्रशासक खाता सफलतापूर्वक बनाया गया है। कृपया नीचे दिए गए बटन पर क्लिक करके अपने खाते की पुष्टि करें।
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Your admin account has been successfully created. Please confirm your account by clicking the button below.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: 600; font-size: 16px;">
              खाते की पुष्टि करें / Confirm Account
            </a>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>सुरक्षा सूचना / Security Notice:</strong><br>
              यदि आपने यह खाता नहीं बनाया है, तो कृपया इस ईमेल को अनदेखा करें।<br>
              If you didn't create this account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Rural Education Attendance Management System<br>
              Empowering Education through Technology
            </p>
          </div>
        </div>
      `,
    });

    console.log("Admin confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
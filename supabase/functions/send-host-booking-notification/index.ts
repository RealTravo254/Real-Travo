import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HostNotificationRequest {
  hostId: string;
  bookingId: string;
  guestName: string;
  itemName: string;
  totalAmount: number;
  visitDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hostId, bookingId, guestName, itemName, totalAmount, visitDate }: HostNotificationRequest = await req.json();

    console.log('Sending host notification for booking:', bookingId);

    // Get host email from profiles
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: host, error: hostError } = await supabaseClient
      .from('profiles')
      .select('email, name')
      .eq('id', hostId)
      .single();

    if (hostError || !host?.email) {
      console.error('Could not find host email:', hostError);
      return new Response(JSON.stringify({ success: false, error: 'Host email not found' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #008080; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #22c55e; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 24px; }
            .amount { font-size: 28px; color: #22c55e; font-weight: bold; }
            .status-badge { display: inline-block; padding: 8px 16px; background: #dcfce7; color: #166534; border-radius: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Booking Received!</h1>
            </div>
            <div class="content">
              <p>Dear ${host.name || 'Host'},</p>
              <p>Great news! You have received a new paid booking.</p>
              
              <div class="detail-box">
                <h2 style="color: #22c55e; margin-top: 0;">Booking Details</h2>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Guest Name:</strong> ${guestName}</p>
                <p><strong>Item:</strong> ${itemName}</p>
                ${visitDate ? `<p><strong>Visit Date:</strong> ${visitDate}</p>` : ''}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p class="amount">Amount Paid: KES ${totalAmount.toLocaleString()}</p>
                <span class="status-badge">✓ Payment Confirmed</span>
              </div>

              <p>The guest has completed payment via M-Pesa. Please prepare for their visit.</p>
              <p>Log in to your dashboard to view full booking details and contact information.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Bookings <onboarding@resend.dev>",
      to: [host.email],
      subject: `New Paid Booking - ${itemName}`,
      html: emailHTML,
    });

    if (error) {
      console.error("Error sending host notification email:", error);
      throw error;
    }

    console.log("Host notification email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-host-booking-notification function:", error);
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

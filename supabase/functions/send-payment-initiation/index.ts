import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentInitiationRequest {
  email: string;
  guestName: string;
  itemName: string;
  totalAmount: number;
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, guestName, itemName, totalAmount, phone }: PaymentInitiationRequest = await req.json();

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4F46E5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #4F46E5; font-size: 20px; margin-top: 0; }
            .amount { font-size: 28px; color: #4F46E5; font-weight: bold; }
            .status { background: #FEF3C7; padding: 10px; border-radius: 4px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📱 Payment Initiated</h1>
            </div>
            <div class="content">
              <p>Dear ${guestName},</p>
              <p>Your payment request has been sent to your phone.</p>
              
              <div class="status">
                <strong>⏳ Awaiting Payment Confirmation</strong>
              </div>

              <div class="detail-box">
                <h2>Payment Details</h2>
                <p><strong>Item:</strong> ${itemName}</p>
                <p><strong>Phone Number:</strong> ${phone}</p>
                <p class="amount">Amount: Sh ${totalAmount}</p>
              </div>

              <div class="detail-box">
                <h2>Next Steps</h2>
                <ol>
                  <li>Check your phone for the M-Pesa payment prompt</li>
                  <li>Enter your M-Pesa PIN to complete the payment</li>
                  <li>You'll receive a confirmation email once payment is successful</li>
                </ol>
              </div>

              <p><strong>Note:</strong> If you don't see the payment prompt, please contact us immediately.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Payments <onboarding@resend.dev>",
      to: [email],
      subject: `Payment Initiated - ${itemName}`,
      html: emailHTML,
    });

    if (error) {
      console.error("Error sending payment initiation email:", error);
      throw error;
    }

    console.log("Payment initiation email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-payment-initiation function:", error);
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

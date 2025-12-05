import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Log ALL incoming requests for debugging
  console.log('=== MPESA CALLBACK ENDPOINT HIT ===');
  console.log('Request Method:', req.method);
  console.log('Request Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
  console.log('Request URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log('Raw Request Body:', rawBody);
    
    const callbackData = JSON.parse(rawBody);
    console.log('M-Pesa Callback Parsed Data:', JSON.stringify(callbackData, null, 2));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { Body } = callbackData;
    const { stkCallback } = Body;

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;
    const resultCode = stkCallback.ResultCode.toString();
    const resultDesc = stkCallback.ResultDesc;

    // Extract receipt number from CallbackMetadata if payment successful
    let mpesaReceiptNumber = null;
    if (resultCode === '0' && stkCallback.CallbackMetadata?.Item) {
      const receiptItem = stkCallback.CallbackMetadata.Item.find(
        (item: any) => item.Name === 'MpesaReceiptNumber'
      );
      if (receiptItem) {
        mpesaReceiptNumber = receiptItem.Value;
      }
    }

    // Determine payment status based on result code
    const paymentStatus = resultCode === '0' ? 'completed' : 'failed';

    // Update pending_payments table
    const { error: updateError } = await supabaseClient
      .from('pending_payments')
      .update({
        payment_status: paymentStatus,
        result_code: resultCode,
        result_desc: resultDesc,
        mpesa_receipt_number: mpesaReceiptNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('checkout_request_id', checkoutRequestId);

    if (updateError) {
      console.error('Error updating pending payment:', updateError);
    } else {
      console.log(`✅ Payment status updated to ${paymentStatus} for ${checkoutRequestId}`);
    }

    // Insert into callback log for audit
    const { error: logError } = await supabaseClient
      .from('mpesa_callback_log')
      .insert({
        checkout_request_id: checkoutRequestId,
        merchant_request_id: merchantRequestId,
        result_code: resultCode,
        result_desc: resultDesc,
        raw_payload: callbackData,
      });

    if (logError) {
      console.error('Error inserting callback log:', logError);
    }

    console.log('CheckoutRequestID:', checkoutRequestId, 'ResultCode:', resultCode, 'Status:', paymentStatus);

    return new Response(JSON.stringify({ 
      ResultCode: 0,
      ResultDesc: 'Accepted'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('❌ M-Pesa callback error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    
    // Still return success to M-Pesa to prevent retries
    return new Response(JSON.stringify({ 
      ResultCode: 0,
      ResultDesc: 'Accepted'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

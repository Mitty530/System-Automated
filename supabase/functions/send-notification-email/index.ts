// Supabase Edge Function for sending email notifications
// This function uses Supabase's built-in email capabilities

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
  notificationType: string
  requestId?: number
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { to, subject, html, text, notificationType, requestId, metadata }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and html or text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email content with ADFD branding
    const emailHtml = html || generateHtmlFromText(text!)
    const brandedHtml = addADFDBranding(emailHtml, notificationType)

    // Send email using SendGrid API
    try {
      console.log('Sending email notification via SendGrid:', {
        to,
        subject,
        notificationType,
        requestId,
        timestamp: new Date().toISOString()
      })

      // Check if environment variables are available
      const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
      const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL')

      console.log('Environment check:', {
        hasApiKey: !!sendGridApiKey,
        hasFromEmail: !!fromEmail,
        fromEmail: fromEmail
      })

      // Send email using SendGrid
      const emailResult = await sendEmailWithSendGrid({
        to,
        subject,
        html: brandedHtml,
        text,
        metadata: { notificationType, requestId, ...metadata }
      })

      if (!emailResult.success) {
        console.error('SendGrid email failed:', emailResult.error)
        throw new Error(emailResult.error || 'Failed to send email')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: emailResult.messageId,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (emailError) {
      console.error('Email sending error:', emailError)
      console.error('Error stack:', emailError.stack)

      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: emailError.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Generate HTML content from plain text
 */
function generateHtmlFromText(text: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
  `
}

/**
 * Add ADFD branding to email HTML
 */
function addADFDBranding(html: string, notificationType: string): string {
  const currentYear = new Date().getFullYear()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ADFD Notification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
            Abu Dhabi Fund for Development
          </h1>
          <p style="color: #e0e7ff; margin: 5px 0 0 0; font-size: 14px;">
            Withdrawal Request Management System
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          ${html}
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            This is an automated notification from the ADFD Withdrawal Request System.
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">
            © ${currentYear} Abu Dhabi Fund for Development. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send email using SendGrid API
 */
async function sendEmailWithSendGrid(emailData: {
  to: string
  subject: string
  html: string
  text?: string
  metadata?: Record<string, any>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')

    if (!sendGridApiKey) {
      console.error('SENDGRID_API_KEY environment variable not set')
      return {
        success: false,
        error: 'SendGrid API key not configured'
      }
    }

    // For development: Use a verified sender email
    // TODO: Replace with your verified sender email from SendGrid
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@adfd.ae'
    const fromName = 'ADFD Withdrawal System'

    console.log('Sending email via SendGrid:', {
      to: emailData.to,
      from: fromEmail,
      subject: emailData.subject
    })

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }],
        from: {
          email: fromEmail,
          name: fromName
        },
        content: [
          { type: 'text/html', value: emailData.html },
          { type: 'text/plain', value: emailData.text || stripHtml(emailData.html) }
        ],
        // Add tracking and analytics
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true }
        },
        // Add custom headers for identification
        custom_args: {
          notification_type: emailData.metadata?.notificationType || 'unknown',
          system: 'adfd-withdrawal-system'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SendGrid API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      return {
        success: false,
        error: `SendGrid API error: ${response.status} - ${errorText}`
      }
    }

    // SendGrid returns 202 for successful requests
    const messageId = response.headers.get('x-message-id') || `sg_${Date.now()}`

    console.log('Email sent successfully via SendGrid:', {
      to: emailData.to,
      subject: emailData.subject,
      messageId,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      messageId
    }

  } catch (error) {
    console.error('Error sending email via SendGrid:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Strip HTML tags from text (simple implementation)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

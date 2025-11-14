import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

/**
 * Quick test endpoint to verify SendGrid API key is working
 * 
 * Usage:
 * GET /api/notifications/test-sendgrid?email=your@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'naveenvenkat58@gmail.com';

    const sendGridApiKey = process.env.SENDGRID_API_KEY;

    // Check if API key is set
    if (!sendGridApiKey) {
      return NextResponse.json({
        success: false,
        error: 'SENDGRID_API_KEY is not set in environment variables',
        check: {
          apiKeyExists: false,
          apiKeyLength: 0,
          apiKeyPrefix: 'none',
        },
        fix: 'Set SENDGRID_API_KEY in your environment variables (Vercel Dashboard → Settings → Environment Variables)',
      }, { status: 400 });
    }

    // Check API key format
    const isValidFormat = sendGridApiKey.startsWith('SG.');
    const apiKeyLength = sendGridApiKey.length;

    if (!isValidFormat) {
      return NextResponse.json({
        success: false,
        error: 'SendGrid API key format is invalid',
        check: {
          apiKeyExists: true,
          apiKeyLength,
          apiKeyPrefix: sendGridApiKey.substring(0, 10) + '...',
          isValidFormat: false,
        },
        fix: 'SendGrid API keys should start with "SG." - Check your API key in SendGrid Dashboard',
      }, { status: 400 });
    }

    // Initialize SendGrid
    sgMail.setApiKey(sendGridApiKey);

    // Try to send a test email
    const testSubject = '🧪 SendGrid API Key Test - Application Console';
    const testContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF9900, #E65C00); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">✅ SendGrid Test</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">API Key Verification</p>
        </div>
        
        <div style="background: #f5f1ec; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; line-height: 1.6; font-size: 16px;">
            <strong>🎉 Success!</strong><br><br>
            If you're reading this email, your SendGrid API key is working correctly!<br><br>
            <strong>Test Details:</strong><br>
            • API Key: Configured ✅<br>
            • SendGrid: Connected ✅<br>
            • Email Delivery: Working ✅<br>
            • Timestamp: ${new Date().toISOString()}<br><br>
            Your notification system is ready to send emails!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Sent from Application Console via SendGrid<br>
            Domain: appconsole.tech
          </p>
        </div>
      </div>
    `;

    try {
      const msg = {
        to: testEmail,
        from: {
          email: 'info@appconsole.tech',
          name: 'Application Console'
        },
        subject: testSubject,
        html: testContent,
      };

      await sgMail.send(msg);

      return NextResponse.json({
        success: true,
        message: `✅ Test email sent successfully to ${testEmail}`,
        check: {
          apiKeyExists: true,
          apiKeyLength,
          apiKeyPrefix: sendGridApiKey.substring(0, 10) + '...',
          isValidFormat: true,
          sendGridConnected: true,
          emailSent: true,
        },
        details: {
          to: testEmail,
          from: 'info@appconsole.tech',
          timestamp: new Date().toISOString(),
        },
        nextSteps: [
          'Check your inbox (and spam folder) for the test email',
          'If you received it, your SendGrid is working correctly',
          'If not, check SendGrid Dashboard for delivery status',
        ],
      });
    } catch (sendError: any) {
      console.error('SendGrid send error:', sendError);

      let errorMessage = 'Failed to send test email';
      let fixSteps: string[] = [];

      if (sendError.response?.body?.errors) {
        const sendGridError = sendError.response.body.errors[0];
        errorMessage = sendGridError.message || errorMessage;

        // Provide specific fixes based on error
        if (sendGridError.message?.includes('verified Sender Identity')) {
          fixSteps = [
            'Go to SendGrid Dashboard → Settings → Sender Authentication',
            'Authenticate your domain: appconsole.tech',
            'Wait for DNS verification to complete (can take up to 48 hours)',
            'Or use a verified single sender email address',
          ];
        } else if (sendGridError.message?.includes('permission')) {
          fixSteps = [
            'Check API key permissions in SendGrid Dashboard',
            'Ensure "Mail Send" permission is enabled',
            'Regenerate API key if needed',
          ];
        } else if (sendGridError.message?.includes('invalid')) {
          fixSteps = [
            'Verify API key is correct in SendGrid Dashboard',
            'Regenerate API key if needed',
            'Update SENDGRID_API_KEY in environment variables',
          ];
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        check: {
          apiKeyExists: true,
          apiKeyLength,
          apiKeyPrefix: sendGridApiKey.substring(0, 10) + '...',
          isValidFormat: true,
          sendGridConnected: true,
          emailSent: false,
        },
        sendGridError: sendError.response?.body?.errors?.[0] || sendError.message,
        fix: fixSteps.length > 0 ? fixSteps : [
          'Check SendGrid Dashboard for error details',
          'Verify API key has correct permissions',
          'Check domain authentication status',
        ],
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test SendGrid',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}


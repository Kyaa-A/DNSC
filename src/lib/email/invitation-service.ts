import { sendEmail } from './email-service'

interface SendOrganizerInvitationParams {
  recipientEmail: string
  recipientName: string
  inviteLink: string
  eventName?: string
}

export async function sendOrganizerInvitationEmail(params: SendOrganizerInvitationParams) {
  const html = buildOrganizerInvitationHtml(params)

  return await sendEmail({
    to: params.recipientEmail,
    subject: params.eventName
      ? `You're invited to organize ${params.eventName} — DNSC Attendance`
      : `You're invited to join DNSC Attendance`,
    html,
    text: `Hi ${params.recipientName},\n\nYou have been invited to join the DNSC Attendance system${
      params.eventName ? ` for ${params.eventName}` : ''
    }.\n\nOpen this link to accept: ${params.inviteLink}`,
  })
}

function buildOrganizerInvitationHtml({ recipientName, inviteLink, eventName }: SendOrganizerInvitationParams): string {
  const escapedName = escapeHtml(recipientName)
  const escapedLink = escapeHtml(inviteLink)
  
  const intro = eventName
    ? `You have been invited to organize <strong style="color:#166534;">${escapeHtml(eventName)}</strong> on the DNSC Attendance system.`
    : 'You have been invited to join the <strong style="color:#166534;">DNSC Attendance</strong> system as an organizer.'

  // Use absolute URL for logo - will be served from your Vercel deployment
  const logoUrl = 'https://dnsc.vercel.app/logo/dnsc.png'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>You're invited to DNSC Attendance</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preview Text -->
  <div style="display:none; max-height:0; overflow:hidden;">
    You've been invited to become an organizer on DNSC Attendance. Accept your invitation to get started.
  </div>
  
  <!-- Email Container -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        
        <!-- Email Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding:32px 40px 24px 40px; text-align:center; background: linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%);">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <img src="${logoUrl}" alt="DNSC Logo" width="80" height="80" style="display:block; margin:0 auto 16px auto; border-radius:12px; background:#ffffff; padding:4px;" />
                    
                    <!-- Title -->
                    <h1 style="margin:0; font-size:24px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">
                      DNSC Attendance
                    </h1>
                    <p style="margin:8px 0 0 0; font-size:14px; color:rgba(255,255,255,0.85); font-weight:500;">
                      Event Management System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Invitation Badge -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <span style="display:inline-block; padding:6px 16px; background-color:#dcfce7; color:#166534; font-size:12px; font-weight:600; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">
                      ✉️ Organizer Invitation
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              
              <!-- Greeting -->
              <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:600; color:#111827; text-align:center;">
                Hello, ${escapedName}! 👋
              </h2>
              
              <!-- Message -->
              <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#4b5563; text-align:center;">
                ${intro}
              </p>
              
              <!-- Benefits Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:20px; background-color:#f9fafb; border-radius:12px; border:1px solid #e5e7eb;">
                    <p style="margin:0 0 12px 0; font-size:14px; font-weight:600; color:#374151;">
                      As an organizer, you'll be able to:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0; font-size:14px; color:#6b7280;">
                          <span style="color:#16a34a; margin-right:8px;">✓</span> Scan QR codes to record attendance
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-size:14px; color:#6b7280;">
                          <span style="color:#16a34a; margin-right:8px;">✓</span> Manage event sessions in real-time
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-size:14px; color:#6b7280;">
                          <span style="color:#16a34a; margin-right:8px;">✓</span> View attendance reports and analytics
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${escapedLink}" style="display:inline-block; padding:16px 48px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; border-radius:10px; box-shadow:0 4px 14px 0 rgba(22, 163, 74, 0.4);">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Note -->
              <p style="margin:20px 0 0 0; font-size:13px; color:#9ca3af; text-align:center;">
                This invitation expires in 48 hours
              </p>
              
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#e5e7eb;"></div>
            </td>
          </tr>
          
          <!-- Fallback Link -->
          <tr>
            <td style="padding:24px 40px;">
              <p style="margin:0 0 8px 0; font-size:13px; color:#6b7280; text-align:center;">
                If the button doesn't work, copy and paste this link:
              </p>
              <p style="margin:0; font-size:12px; color:#16a34a; text-align:center; word-break:break-all;">
                <a href="${escapedLink}" style="color:#16a34a; text-decoration:underline;">${escapedLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px 0; font-size:13px; color:#9ca3af;">
                      Davao del Norte State College
                    </p>
                    <p style="margin:0; font-size:12px; color:#d1d5db;">
                      This is an automated message from DNSC Attendance System.<br/>
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer Links -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px; margin-top:24px;">
          <tr>
            <td align="center">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} DNSC Attendance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

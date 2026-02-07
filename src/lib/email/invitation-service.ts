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
      ? `Invitation to organize ${params.eventName} — DNSC Attendance`
      : 'Organizer invitation — DNSC Attendance',
    html,
    text: `Hi ${params.recipientName},\n\nYou have been invited to join the DNSC Attendance system${
      params.eventName ? ` for ${params.eventName}` : ''
    }.\n\nOpen this link to accept: ${params.inviteLink}`,
    // No attachments to avoid logo being shown as an attachment
  })
}

function buildOrganizerInvitationHtml({ recipientName, inviteLink, eventName }: SendOrganizerInvitationParams): string {
  const intro = eventName
    ? `You have been invited to organize <strong>${escapeHtml(eventName)}</strong> on the DNSC Attendance system.`
    : 'You have been invited to join the DNSC Attendance system as an organizer.'

  const escapedName = escapeHtml(recipientName)
  const escapedLink = escapeHtml(inviteLink)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>You're invited to organize with DNSC Attendance</title>
  <style>
    body { margin:0; padding:0; background-color:#f8fafc; }
  </style>
  </head>
  <body>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc; padding:32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff; font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding:20px; background-color:#22964d; color:#ffffff;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center">
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align:middle; text-align:center;">
                            <h1 style="margin:0; font-size:24px; line-height:32px; font-weight:600; letter-spacing:-0.01em;">DNSC Attendance</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px; background-color:#ffffff;">
                <p style="margin:0 0 24px 0; font-size:15px; line-height:1.5;">
                  Hi <span style="color:#22964d; font-weight:600;">${escapedName}</span>,
                </p>

                <div style="margin-bottom:32px;">
                  <p style="margin:0 0 16px 0; font-size:15px; color:#1F2937; line-height:1.6;">
                    ${intro}
                  </p>
                  <p style="margin:0; font-size:15px; color:#1F2937; line-height:1.6;">
                    Click the button below to accept the invitation and set up your account.
                  </p>
                </div>

                <div style="text-align:center; margin-bottom:32px;">
                  <a href="${escapedLink}" style="display:inline-block; background-color:#22964d; color:#ffffff; padding:12px 32px; border-radius:6px; text-decoration:none; font-size:15px; font-weight:500; box-shadow:0 1px 2px rgba(0, 0, 0, 0.05);">
                    Accept Invitation
                  </a>
                </div>

                <div style="padding:16px; background-color:#F9FAFB; border-radius:8px; margin-top:32px;">
                  <p style="margin:0 0 8px 0; font-size:14px; color:#4B5563; line-height:1.5;">
                    If the button does not work, copy and paste this link into your browser:
                  </p>
                  <a href="${escapedLink}" style="color:#2563EB; text-decoration:none; font-size:14px; word-break:break-all; display:block;">
                    ${escapedLink}
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px; background-color:#ffffff; font-size:13px; color:#64748B; border-top:1px solid #E2E8F0;">
                <p style="margin:0;">This email was sent by the DNSC Attendance System.</p>
                <p style="margin:0;">Please do not reply directly to this email.</p>
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
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;')
}



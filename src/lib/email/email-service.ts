import { createSmtpConfig, createTransporter, getEmailDefaults } from './nodemailer-config'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename?: string
    content?: string | Buffer
    path?: string
    cid?: string
    contentType?: string
  }>
}

export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const config = createSmtpConfig()
  const transporter = createTransporter(config)
  const defaults = getEmailDefaults()

  const info = await transporter.sendMail({
    from: defaults.from,
    to: Array.isArray(options.to) ? options.to.join(',') : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
    replyTo: defaults.replyTo,
  })

  return { messageId: info.messageId }
}

export async function sendTestEmail(recipient: string) {
  return await sendEmail({
    to: recipient,
    subject: 'DNSC Attendance: Test Email',
    text: 'This is a test email from DNSC Attendance system.',
    html: '<p>This is a <strong>test email</strong> from DNSC Attendance system.</p>',
  })
}



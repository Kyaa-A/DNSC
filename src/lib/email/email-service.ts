import { Resend } from 'resend'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable')
  }
  return new Resend(apiKey)
}

const getFromEmail = () => {
  return process.env.EMAIL_FROM || 'DNSC Attendance <onboarding@resend.dev>'
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const resend = getResend()
  const from = getFromEmail()
  const to = Array.isArray(options.to) ? options.to : [options.to]

  // Use type assertion since Resend's types are overly strict
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailOptions: any = {
    from,
    to,
    subject: options.subject,
  }

  if (options.text) {
    emailOptions.text = options.text
  }
  if (options.html) {
    emailOptions.html = options.html
  }

  const { data, error } = await resend.emails.send(emailOptions)

  if (error) {
    console.error('Resend email error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { messageId: data?.id || 'unknown' }
}

export async function sendTestEmail(recipient: string) {
  return await sendEmail({
    to: recipient,
    subject: 'DNSC Attendance: Test Email',
    text: 'This is a test email from DNSC Attendance system.',
    html: '<p>This is a <strong>test email</strong> from DNSC Attendance system.</p>',
  })
}

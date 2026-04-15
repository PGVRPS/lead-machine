/**
 * Bigin email operations — send emails through Bigin and
 * retrieve email tracking data (opens, clicks, replies).
 */

import { biginRequest } from './client'

export type SendEmailParams = {
  /** Bigin Contact record id to send to */
  contactId: string
  /** Recipient email address — required by Bigin's send_mail API */
  toEmail: string
  /** Verified from address configured in Bigin org email settings */
  fromEmail: string
  subject: string
  /** HTML or plain-text body */
  body: string
}

export type BiginEmailStatus = {
  messageId: string
  status: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced'
  sentAt?: string
  openedAt?: string
}

/**
 * Send an email to a Bigin contact via the Bigin Send Mail API.
 * Returns the Bigin message id for later tracking.
 */
export async function sendEmailToContact(params: SendEmailParams): Promise<string> {
  const payload = {
    data: [
      {
        from: { email: params.fromEmail },
        to: [{ user_type: 'lead', object_id: params.contactId, email: params.toEmail }],
        subject: params.subject,
        content: params.body,
        mail_format: 'html',
      },
    ],
  }

  const res = await biginRequest<{
    data: { code: string; details: { id: string }; message: string }[]
  }>(`/Contacts/${params.contactId}/actions/send_mail`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const record = res.data[0]
  if (record.code !== 'SUCCESS') {
    throw new Error(`Bigin send mail failed: ${record.message}`)
  }

  return record.details.id
}

/**
 * Fetch emails sent to a Bigin contact.
 * Used to pull open/click/reply status back into the app.
 */
export async function getContactEmails(contactId: string): Promise<
  {
    id: string
    subject: string
    sent_time: string
    status: string
  }[]
> {
  const res = await biginRequest<{
    data: { id: string; subject: string; sent_time: string; status: string }[]
  }>(`/Contacts/${contactId}/Emails`).catch(() => null)

  return res?.data ?? []
}

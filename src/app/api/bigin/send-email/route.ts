import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { upsertContact, mapToBeginContact } from '@/lib/bigin/contacts'
import { sendEmailToContact } from '@/lib/bigin/emails'
import { createOutreach, updateContactBiginId } from '@/lib/supabase/db'

export async function POST(req: NextRequest) {
  try {
    const { contactId, subject, body, toEmail, toName } = await req.json() as {
      contactId: string | null
      subject: string
      body: string
      toEmail?: string
      toName?: string
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
    }

    let biginContactId: string
    let recipientEmail: string
    let propertyId: string = ''
    let resolvedContactId: string | null = contactId

    if (!contactId) {
      // Custom recipient mode — toEmail is required
      if (!toEmail) {
        return NextResponse.json({ error: 'toEmail is required when contactId is not provided' }, { status: 400 })
      }
      recipientEmail = toEmail
      const payload = {
        Last_Name: toName ? (toName.split(' ').pop() ?? toName) : 'Recipient',
        First_Name: toName && toName.includes(' ') ? toName.split(' ').slice(0, -1).join(' ') : undefined,
        Email: toEmail,
      }
      biginContactId = await upsertContact(payload)
      resolvedContactId = null
    } else {
      // Contact from DB
      const supabase = createServerClient()
      const { data: contact, error: contactErr } = await supabase
        .from('contacts')
        .select('*, properties ( id, name )')
        .eq('id', contactId)
        .single()

      if (contactErr || !contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }

      const property = contact.properties as { id: string; name: string } | null
      propertyId = property?.id ?? ''
      recipientEmail = contact.email ?? ''

      // Use real contact — sync to Bigin if not already done
      biginContactId = contact.bigin_contact_id ?? ''
      if (!biginContactId) {
        const biginPayload = mapToBeginContact({
          contact_name: contact.contact_name,
          contact_title: contact.contact_title,
          email: contact.email,
          phone: contact.phone,
          management_company: contact.management_company,
          propertyName: property?.name ?? 'Unknown Property',
          propertyId: propertyId,
        })
        biginContactId = await upsertContact(biginPayload)
        await updateContactBiginId(contactId, biginContactId)
      }
    }

    // Send email via Bigin
    const biginMessageId = await sendEmailToContact({
      contactId: biginContactId,
      toEmail: recipientEmail,
      fromEmail: process.env.ZOHO_BIGIN_FROM_EMAIL ?? 'sales@vrpsinc.com',
      subject,
      body,
    })

    // Log to Supabase outreach table
    const outreach = await createOutreach({
      property_id: propertyId,
      contact_id: resolvedContactId ?? '',
      subject,
      body,
      bigin_message_id: biginMessageId,
    })

    return NextResponse.json({ success: true, outreachId: outreach.id, biginMessageId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[bigin/send-email]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

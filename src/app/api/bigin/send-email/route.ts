import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { upsertContact, mapToBeginContact } from '@/lib/bigin/contacts'
import { sendEmailToContact } from '@/lib/bigin/emails'
import { createOutreach, updateContactBiginId } from '@/lib/supabase/db'

export async function POST(req: NextRequest) {
  try {
    const { contactId, subject, body } = await req.json() as {
      contactId: string
      subject: string
      body: string
    }

    if (!contactId || !subject || !body) {
      return NextResponse.json({ error: 'contactId, subject, and body are required' }, { status: 400 })
    }

    // Fetch contact + property from Supabase
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

    // Sync contact to Bigin (creates if not exists, reuses if already synced)
    let biginContactId: string = contact.bigin_contact_id ?? ''

    if (!biginContactId) {
      const biginPayload = mapToBeginContact({
        contact_name: contact.contact_name,
        contact_title: contact.contact_title,
        email: contact.email,
        phone: contact.phone,
        management_company: contact.management_company,
        propertyName: property?.name ?? 'Unknown Property',
        propertyId: property?.id ?? '',
      })

      biginContactId = await upsertContact(biginPayload)
      await updateContactBiginId(contactId, biginContactId)
    }

    // Send email via Bigin
    const biginMessageId = await sendEmailToContact({
      contactId: biginContactId,
      fromName: 'Sean',
      fromEmail: 'sean@vrps.com',
      subject,
      body,
    })

    // Log to Supabase outreach table
    const outreach = await createOutreach({
      property_id: property?.id ?? '',
      contact_id: contactId,
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

import { NextRequest } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/client'
import { organizerAcceptSchema } from '@/lib/validations/organizer-accept'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = organizerAcceptSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
    }

    const { token, password } = parsed.data

    // Look up organizer by token and ensure not expired
    const organizer = await prisma.organizer.findFirst({
      where: {
        invitationToken: token,
        invitationExpiresAt: { gt: new Date() },
      },
    })

    if (!organizer) {
      return Response.json({ error: 'Invalid or expired invitation token' }, { status: 400 })
    }

    // Hash the password
    const passwordHash = await hash(password, 12)

    // Create or update User record in the database
    await prisma.user.upsert({
      where: { email: organizer.email.toLowerCase() },
      update: {
        passwordHash,
        name: organizer.fullName,
        role: organizer.role,
        isActive: true,
      },
      create: {
        email: organizer.email.toLowerCase(),
        passwordHash,
        name: organizer.fullName,
        role: organizer.role,
        isActive: true,
      },
    })

    // Activate organizer, clear token
    await prisma.organizer.update({
      where: { id: organizer.id },
      data: {
        isActive: true,
        invitationToken: null,
        invitationExpiresAt: null,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Organizer accept error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

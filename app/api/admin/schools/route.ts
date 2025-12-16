import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can view managed schools' },
        { status: 403 }
      )
    }

    const schools = await db.school.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load schools' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can create schools' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSchoolSchema.parse(body)

    // Check if school already exists
    const existing = await db.school.findUnique({
      where: { name: validatedData.name },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'School already exists' },
        { status: 400 }
      )
    }

    const school = await db.school.create({
      data: {
        name: validatedData.name.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        createdAt: school.createdAt,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create school' },
      { status: 500 }
    )
  }
}


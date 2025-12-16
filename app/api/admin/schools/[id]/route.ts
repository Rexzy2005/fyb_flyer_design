import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can update schools' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchoolSchema.parse(body)

    // Check if another school with same name exists
    const existing = await db.school.findFirst({
      where: {
        name: validatedData.name.trim(),
        id: { not: id },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'School name already exists' },
        { status: 400 }
      )
    }

    const school = await db.school.update({
      where: { id },
      data: {
        name: validatedData.name.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        updatedAt: school.updatedAt,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Some of the school details are not valid. Please check and try again.' },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    console.error('Failed to update school:', error)
    return NextResponse.json(
      { success: false, error: 'We could not update the school. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete schools' },
        { status: 403 }
      )
    }

    const { id } = await params

    await db.school.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'School deleted successfully',
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    console.error('Failed to delete school:', error)
    return NextResponse.json(
      { success: false, error: 'We could not delete the school. Please try again.' },
      { status: 500 }
    )
  }
}


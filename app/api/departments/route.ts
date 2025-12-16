import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const departments = await db.user.findMany({
      where: {
        department: query
          ? {
              contains: query,
              mode: 'insensitive',
            }
          : {
              not: null,
            },
      },
      select: {
        department: true,
      },
      distinct: ['department'],
      take: 10,
    })

    const names = departments
      .map((d) => d.department)
      .filter((d): d is string => !!d)
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      success: true,
      departments: names,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load departments' },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // Get admin-managed schools from School table
    const adminSchools = await db.school.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : {},
      orderBy: { name: 'asc' },
      take: 50,
    })

    // Also get user-entered schools for suggestions
    const userSchools = await db.user.findMany({
      where: {
        school: query
          ? {
              contains: query,
              mode: 'insensitive',
            }
          : {
              not: null,
            },
      },
      select: {
        school: true,
      },
      distinct: ['school'],
      take: 10,
    })

    const adminNames = adminSchools.map((s) => s.name)
    const userNames = userSchools
      .map((s) => s.school)
      .filter((s): s is string => !!s && !adminNames.includes(s))
      .sort((a, b) => a.localeCompare(b))

    // Combine: admin schools first, then user-entered schools
    const allSchools = [...adminNames, ...userNames]

    return NextResponse.json({
      success: true,
      schools: allSchools,
      adminManaged: adminNames,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load schools' },
      { status: 500 }
    )
  }
}



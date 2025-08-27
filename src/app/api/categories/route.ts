import { NextRequest, NextResponse } from 'next/server'
import { readJsonData } from '@/utils/dataAccess'

export async function GET() {
  try {
    // Read categories using Vercel-compatible utility
    const categories = await readJsonData('categories.json')

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error reading categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load categories' },
      { status: 500 }
    )
  }
}
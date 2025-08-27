import { NextRequest, NextResponse } from 'next/server'
import { readJsonData } from '@/utils/dataAccess'

export async function GET(request: NextRequest) {
  try {
    // Read products using Vercel-compatible utility
    let products = await readJsonData('products.json')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Filter by category if specified
    if (category) {
      products = products.filter((product: any) => product.category === category)
    }

    // Filter by search query if specified
    if (search) {
      const searchLower = search.toLowerCase()
      products = products.filter((product: any) => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      )
    }

    // Calculate pagination
    const total = products.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = products.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedProducts,
        meta: {
          page,
          limit,
          total,
          totalPages
        }
      }
    })
  } catch (error) {
    console.error('Error reading products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load products' },
      { status: 500 }
    )
  }
}
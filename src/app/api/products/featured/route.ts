import { NextRequest, NextResponse } from 'next/server'
import { readJsonData } from '@/utils/dataAccess'

export async function GET() {
  try {
    // Read products using Vercel-compatible utility
    const products = await readJsonData('products.json')
    
    // Filter featured products
    const featuredProducts = products.filter((product: any) => product.featured === true)

    return NextResponse.json({
      success: true,
      data: featuredProducts
    })
  } catch (error) {
    console.error('Error reading featured products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load featured products' },
      { status: 500 }
    )
  }
}
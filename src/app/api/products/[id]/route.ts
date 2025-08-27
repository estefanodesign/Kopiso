import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const filePath = path.join(process.cwd(), 'data', 'products.json')
    const jsonData = fs.readFileSync(filePath, 'utf8')
    const products = JSON.parse(jsonData)
    
    // Find product by ID
    const product = products.find((p: any) => p.id === id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error reading product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load product' },
      { status: 500 }
    )
  }
}
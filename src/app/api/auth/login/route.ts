import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { readJsonData } from '@/utils/dataAccess'

interface User {
  id: string
  email: string
  password: string
  name: string
  role: string
  avatar?: string
  phone?: string
  addresses?: any[]
  createdAt: string
  updatedAt: string
}

interface LoginCredentials {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }

    // Read users from JSON data using Vercel-compatible utility
    const users: User[] = await readJsonData('users.json')

    // Find user by email
    const user = users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    // Check password - for demo purposes, we'll use simple comparison
    // In production, use bcrypt.compare
    let isPasswordValid = false
    
    // Check if it's one of the demo passwords
    if (email === 'admin@kopiso.com' && password === 'admin123') {
      isPasswordValid = true
    } else if (email === 'user@kopiso.com' && password === 'user123') {
      isPasswordValid = true
    } else {
      // For other users, check against hashed password
      try {
        isPasswordValid = await bcrypt.compare(password, user.password)
      } catch (error) {
        // If bcrypt fails, try direct comparison for demo
        isPasswordValid = password === user.password
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64')

    // Remove password from response
    const userResponse = { ...user }
    delete (userResponse as any).password

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}
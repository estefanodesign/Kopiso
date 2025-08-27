'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { notifications } from '@/utils/notifications'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isEmailSent, setIsEmailSent] = React.useState(false)
  const [validationError, setValidationError] = React.useState('')

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email is required'
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateEmail(email)
    if (error) {
      setValidationError(error)
      notifications.form.validationErrors([error])
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, always succeed
      setIsEmailSent(true)
      notifications.success('Password reset instructions sent to your email')
    } catch (error) {
      notifications.error('Failed to send password reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (validationError) {
      setValidationError('')
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h1>
            
            <p className="text-gray-600 mb-6">
              We have sent password reset instructions to{' '}
              <span className="font-medium text-gray-900">{email}</span>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Did not receive the email?</strong><br />
                • Check your spam/junk folder<br />
                • Make sure you entered the correct email address<br />
                • Wait a few minutes for the email to arrive
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsEmailSent(false)
                  setEmail('')
                }}
                className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Try Different Email
              </button>
              
              <Link
                href="/auth/login"
                className="block w-full text-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold text-gradient">Kopiso</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            No worries! Enter your email address and we will send you reset instructions.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    validationError
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              </div>
              {validationError && (
                <p className="mt-1 text-sm text-red-600">{validationError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link
              href="/auth/login"
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              ← Back to Login
            </Link>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  )
}
import { notifications } from './notifications'

export interface ValidationRule {
  message: string
  validate: (value: any, formData?: any) => boolean
}

export interface ValidationSchema {
  [key: string]: ValidationRule[]
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  firstError?: string
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    message,
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    }
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true // Let required rule handle empty values
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
      return emailRegex.test(value)
    }
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    message: message || `Must be at least ${min} characters long`,
    validate: (value) => {
      if (!value) return true
      return String(value).length >= min
    }
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    message: message || `Must be no more than ${max} characters long`,
    validate: (value) => {
      if (!value) return true
      return String(value).length <= max
    }
  }),

  minValue: (min: number, message?: string): ValidationRule => ({
    message: message || `Must be at least ${min}`,
    validate: (value) => {
      if (!value) return true
      const numValue = Number(value)
      return !isNaN(numValue) && numValue >= min
    }
  }),

  maxValue: (max: number, message?: string): ValidationRule => ({
    message: message || `Must be no more than ${max}`,
    validate: (value) => {
      if (!value) return true
      const numValue = Number(value)
      return !isNaN(numValue) && numValue <= max
    }
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      return regex.test(String(value))
    }
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      const phoneRegex = /^[\\d\\s\\+\\-\\(\\)]+$/
      return phoneRegex.test(value) && value.replace(/\\D/g, '').length >= 10
    }
  }),

  password: (message = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      return /(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(value)
    }
  }),

  confirmPassword: (message = 'Passwords do not match'): ValidationRule => ({
    message,
    validate: (value, formData) => {
      if (!value || !formData) return true
      return value === formData.password
    }
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    }
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      const numValue = Number(value)
      return !isNaN(numValue) && numValue > 0
    }
  }),

  integer: (message = 'Must be a whole number'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      const numValue = Number(value)
      return !isNaN(numValue) && Number.isInteger(numValue)
    }
  }),

  creditCard: (message = 'Please enter a valid credit card number'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      const cleaned = value.replace(/\\D/g, '')
      return cleaned.length >= 13 && cleaned.length <= 19 && luhnCheck(cleaned)
    }
  }),

  zipCode: (message = 'Please enter a valid zip code'): ValidationRule => ({
    message,
    validate: (value) => {
      if (!value) return true
      return /^\\d{5}(-\\d{4})?$/.test(value)
    }
  }),

  custom: (validator: (value: any, formData?: any) => boolean, message: string): ValidationRule => ({
    message,
    validate: validator
  })
}

// Luhn algorithm for credit card validation
function luhnCheck(num: string): boolean {
  let sum = 0
  let isEven = false
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Validation engine
export class Validator {
  private schema: ValidationSchema
  private showNotifications: boolean

  constructor(schema: ValidationSchema, showNotifications = false) {
    this.schema = schema
    this.showNotifications = showNotifications
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}
    let firstError: string | undefined

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field]
      
      for (const rule of rules) {
        if (!rule.validate(value, data)) {
          errors[field] = rule.message
          if (!firstError) {
            firstError = rule.message
          }
          break // Stop at first error for this field
        }
      }
    }

    const isValid = Object.keys(errors).length === 0

    // Show notifications if enabled
    if (this.showNotifications && !isValid) {
      const errorMessages = Object.values(errors)
      notifications.form.validationErrors(errorMessages)
    }

    return {
      isValid,
      errors,
      firstError
    }
  }

  validateField(field: string, value: any, formData?: Record<string, any>): string | null {
    const rules = this.schema[field]
    if (!rules) return null

    for (const rule of rules) {
      if (!rule.validate(value, formData)) {
        return rule.message
      }
    }

    return null
  }
}

// Common validation schemas
export const CommonSchemas = {
  login: {
    email: [ValidationRules.required(), ValidationRules.email()],
    password: [ValidationRules.required(), ValidationRules.minLength(6)]
  },

  register: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    email: [ValidationRules.required(), ValidationRules.email()],
    phone: [ValidationRules.required(), ValidationRules.phone()],
    password: [ValidationRules.required(), ValidationRules.minLength(6), ValidationRules.password()],
    confirmPassword: [ValidationRules.required(), ValidationRules.confirmPassword()]
  },

  profile: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    email: [ValidationRules.required(), ValidationRules.email()],
    phone: [ValidationRules.required(), ValidationRules.phone()],
    dateOfBirth: [ValidationRules.pattern(/^\\d{4}-\\d{2}-\\d{2}$/, 'Please enter a valid date')]
  },

  product: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(200)],
    description: [ValidationRules.required(), ValidationRules.minLength(10), ValidationRules.maxLength(2000)],
    price: [ValidationRules.required(), ValidationRules.positiveNumber()],
    stock: [ValidationRules.required(), ValidationRules.integer(), ValidationRules.minValue(0)],
    category: [ValidationRules.required()],
    sku: [ValidationRules.required(), ValidationRules.pattern(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')]
  },

  address: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    street: [ValidationRules.required(), ValidationRules.minLength(5), ValidationRules.maxLength(200)],
    city: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    state: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    zipCode: [ValidationRules.required(), ValidationRules.zipCode()],
    country: [ValidationRules.required()],
    phone: [ValidationRules.required(), ValidationRules.phone()]
  },

  payment: {
    cardNumber: [ValidationRules.required(), ValidationRules.creditCard()],
    expiryMonth: [ValidationRules.required(), ValidationRules.minValue(1), ValidationRules.maxValue(12)],
    expiryYear: [ValidationRules.required(), ValidationRules.minValue(new Date().getFullYear())],
    cvv: [ValidationRules.required(), ValidationRules.pattern(/^\\d{3,4}$/, 'CVV must be 3 or 4 digits')],
    nameOnCard: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)]
  }
}

// Input sanitization utilities
export const Sanitizer = {
  text: (input: string): string => {
    return input.trim().replace(/[<>\"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '\"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[char] || char
    })
  },

  email: (input: string): string => {
    return input.trim().toLowerCase()
  },

  phone: (input: string): string => {
    return input.replace(/[^\\d\\+\\-\\(\\)\\s]/g, '')
  },

  number: (input: string): number | null => {
    const num = parseFloat(input.replace(/[^\\d\\.\\-]/g, ''))
    return isNaN(num) ? null : num
  },

  integer: (input: string): number | null => {
    const num = parseInt(input.replace(/[^\\d\\-]/g, ''), 10)
    return isNaN(num) ? null : num
  },

  url: (input: string): string => {
    let url = input.trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    return url
  },

  filename: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9._-]/g, '_')
  }
}

// Error formatting utilities
export const ErrorFormatter = {
  formatValidationErrors: (errors: Record<string, string>): string[] => {
    return Object.values(errors).filter(Boolean)
  },

  formatApiError: (error: any): string => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error) return error.error
    if (error?.data?.message) return error.data.message
    return 'An unexpected error occurred'
  },

  formatFieldError: (fieldName: string, error: string): string => {
    const fieldLabels: Record<string, string> = {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      name: 'Name',
      phone: 'Phone Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'Zip Code',
      cardNumber: 'Card Number',
      cvv: 'CVV'
    }
    
    const label = fieldLabels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    return `${label}: ${error}`
  }
}

// Create validator instances for common use cases
export const createValidator = (schema: ValidationSchema, showNotifications = false) => {
  return new Validator(schema, showNotifications)
}

export const LoginValidator = createValidator(CommonSchemas.login)
export const RegisterValidator = createValidator(CommonSchemas.register)
export const ProfileValidator = createValidator(CommonSchemas.profile)
export const ProductValidator = createValidator(CommonSchemas.product)
export const AddressValidator = createValidator(CommonSchemas.address)
export const PaymentValidator = createValidator(CommonSchemas.payment)

export default {
  ValidationRules,
  Validator,
  CommonSchemas,
  Sanitizer,
  ErrorFormatter,
  createValidator
}
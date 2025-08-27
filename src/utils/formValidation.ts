import { ValidationRules, Validator, ValidationResult } from './validation'
import { notifications } from './notifications'

// Enhanced form validation schemas
export const FormValidationSchemas = {
  // User authentication forms
  login: {
    email: [ValidationRules.required(), ValidationRules.email()],
    password: [ValidationRules.required(), ValidationRules.minLength(6)]
  },

  register: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(50)],
    email: [ValidationRules.required(), ValidationRules.email()],
    phone: [ValidationRules.required(), ValidationRules.phone()],
    password: [ValidationRules.required(), ValidationRules.minLength(6), ValidationRules.password()],
    confirmPassword: [ValidationRules.required(), ValidationRules.confirmPassword()],
    terms: [ValidationRules.custom(
      (value) => value === true,
      'Please agree to the terms and conditions'
    )]
  },

  forgotPassword: {
    email: [ValidationRules.required(), ValidationRules.email()]
  },

  resetPassword: {
    password: [ValidationRules.required(), ValidationRules.minLength(6), ValidationRules.password()],
    confirmPassword: [ValidationRules.required(), ValidationRules.confirmPassword()],
    token: [ValidationRules.required()]
  },

  // Product forms
  product: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    description: [ValidationRules.required(), ValidationRules.minLength(10), ValidationRules.maxLength(1000)],
    price: [ValidationRules.required(), ValidationRules.positiveNumber()],
    category: [ValidationRules.required()],
    brand: [ValidationRules.required(), ValidationRules.minLength(1), ValidationRules.maxLength(50)],
    stock: [ValidationRules.required(), ValidationRules.integer(), ValidationRules.minValue(0)],
    sku: [ValidationRules.maxLength(50)],
    weight: [ValidationRules.positiveNumber()],
    dimensions: [ValidationRules.maxLength(100)]
  },

  // User profile forms
  profile: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(50)],
    email: [ValidationRules.required(), ValidationRules.email()],
    phone: [ValidationRules.phone()],
    dateOfBirth: [ValidationRules.custom(
      (value) => {
        if (!value) return true
        const date = new Date(value)
        const now = new Date()
        return date <= now
      },
      'Date of birth cannot be in the future'
    )]
  },

  // Address forms
  address: {
    street: [ValidationRules.required(), ValidationRules.minLength(5), ValidationRules.maxLength(100)],
    city: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(50)],
    state: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(50)],
    zipCode: [ValidationRules.required(), ValidationRules.zipCode()],
    country: [ValidationRules.required()],
    firstName: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(30)],
    lastName: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(30)],
    phone: [ValidationRules.phone()]
  },

  // Payment forms
  payment: {
    cardNumber: [ValidationRules.required(), ValidationRules.creditCard()],
    expiryMonth: [ValidationRules.required(), ValidationRules.custom(
      (value) => {
        const month = parseInt(value)
        return month >= 1 && month <= 12
      },
      'Please select a valid month'
    )],
    expiryYear: [ValidationRules.required(), ValidationRules.custom(
      (value) => {
        const year = parseInt(value)
        const currentYear = new Date().getFullYear()
        return year >= currentYear && year <= currentYear + 20
      },
      'Please select a valid year'
    )],
    cvv: [ValidationRules.required(), ValidationRules.pattern(
      /^\d{3,4}$/,
      'CVV must be 3 or 4 digits'
    )],
    cardholderName: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(50)]
  },

  // Contact form
  contact: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(50)],
    email: [ValidationRules.required(), ValidationRules.email()],
    subject: [ValidationRules.required(), ValidationRules.minLength(5), ValidationRules.maxLength(100)],
    message: [ValidationRules.required(), ValidationRules.minLength(10), ValidationRules.maxLength(1000)]
  },

  // Newsletter subscription
  newsletter: {
    email: [ValidationRules.required(), ValidationRules.email()]
  },

  // Review form
  review: {
    rating: [ValidationRules.required(), ValidationRules.custom(
      (value) => {
        const rating = parseInt(value)
        return rating >= 1 && rating <= 5
      },
      'Please select a rating between 1 and 5'
    )],
    title: [ValidationRules.required(), ValidationRules.minLength(5), ValidationRules.maxLength(100)],
    comment: [ValidationRules.required(), ValidationRules.minLength(10), ValidationRules.maxLength(500)]
  }
}

// Enhanced form validation hook
export class FormValidator {
  private validator: Validator
  private schema: any
  private formName: string

  constructor(schemaKey: keyof typeof FormValidationSchemas, formName: string = 'Form') {
    this.schema = FormValidationSchemas[schemaKey]
    this.validator = new Validator(this.schema, false)
    this.formName = formName
  }

  // Validate entire form
  validateForm(data: Record<string, any>): ValidationResult & { 
    showErrors: () => void 
    hasErrors: boolean 
  } {
    const result = this.validator.validate(data)
    
    return {
      ...result,
      hasErrors: !result.isValid,
      showErrors: () => {
        if (!result.isValid) {
          const errorMessages = Object.values(result.errors)
          notifications.form.validationErrors(errorMessages)
        }
      }
    }
  }

  // Validate single field
  validateField(fieldName: string, value: any, formData?: Record<string, any>): {
    isValid: boolean
    error: string | null
    showError: () => void
  } {
    const error = this.validator.validateField(fieldName, value, formData)
    
    return {
      isValid: !error,
      error,
      showError: () => {
        if (error) {
          notifications.error(error, `${this.formName} Validation`)
        }
      }
    }
  }

  // Real-time field validation with debouncing
  createFieldValidator(fieldName: string, debounceMs: number = 300) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (value: any, formData?: Record<string, any>, showErrors = false) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      return new Promise<{ isValid: boolean; error: string | null }>((resolve) => {
        timeoutId = setTimeout(() => {
          const validation = this.validateField(fieldName, value, formData)
          
          if (showErrors && !validation.isValid) {
            validation.showError()
          }
          
          resolve({
            isValid: validation.isValid,
            error: validation.error
          })
        }, debounceMs)
      })
    }
  }

  // Validate form on submit with enhanced error handling
  async validateOnSubmit(
    data: Record<string, any>,
    options: {
      showNotifications?: boolean
      focusFirstError?: boolean
      scrollToError?: boolean
    } = {}
  ): Promise<ValidationResult & { canSubmit: boolean }> {
    const { showNotifications = true, focusFirstError = true, scrollToError = true } = options
    
    const result = this.validator.validate(data)
    
    if (!result.isValid) {
      // Show error notifications
      if (showNotifications) {
        const errorMessages = Object.values(result.errors)
        notifications.form.validationErrors(errorMessages)
      }

      // Focus first error field
      if (focusFirstError && typeof window !== 'undefined') {
        const firstErrorField = Object.keys(result.errors)[0]
        const fieldElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
        
        if (fieldElement) {
          fieldElement.focus()
          
          // Scroll to error if needed
          if (scrollToError) {
            fieldElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
          }
        }
      }
    }

    return {
      ...result,
      canSubmit: result.isValid
    }
  }
}

// Form error display utilities
export const FormErrorDisplay = {
  // Get error class for input fields
  getInputErrorClass(hasError: boolean, baseClass: string = ''): string {
    return hasError 
      ? `${baseClass} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500`.trim()
      : `${baseClass} border-gray-300 focus:border-primary-500 focus:ring-primary-500`.trim()
  },

  // Get error message component props
  getErrorMessageProps(error: string | null): {
    show: boolean
    message: string
    className: string
  } {
    return {
      show: !!error,
      message: error || '',
      className: 'mt-1 text-sm text-red-600'
    }
  },

  // Format field label with required indicator
  formatLabel(label: string, required: boolean = false): string {
    return required ? `${label} *` : label
  }
}

// Export commonly used validators for direct use
export const CommonValidators = {
  email: new FormValidator('login'),
  registration: new FormValidator('register'),
  product: new FormValidator('product'),
  profile: new FormValidator('profile'),
  address: new FormValidator('address'),
  payment: new FormValidator('payment'),
  contact: new FormValidator('contact'),
  review: new FormValidator('review')
}

// Form submission helper with error handling
export const submitFormWithValidation = async <T>(
  formData: Record<string, any>,
  validator: FormValidator,
  submitFunction: (data: Record<string, any>) => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    onSuccess?: (result: T) => void
    onError?: (error: any) => void
  } = {}
): Promise<{ success: boolean; data?: T; error?: any }> => {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
    onSuccess,
    onError
  } = options

  try {
    // Validate form first
    const validation = await validator.validateOnSubmit(formData)
    
    if (!validation.canSubmit) {
      return { success: false, error: 'Validation failed' }
    }

    // Show loading notification
    const toastId = notifications.info(loadingMessage)

    try {
      // Submit form
      const result = await submitFunction(formData)
      
      // Show success notification
      notifications.success(successMessage)
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result)
      }

      return { success: true, data: result }
    } catch (submitError) {
      // Show error notification
      notifications.error(errorMessage)
      
      // Call error callback
      if (onError) {
        onError(submitError)
      }

      return { success: false, error: submitError }
    }
  } catch (error) {
    notifications.error('An unexpected error occurred')
    return { success: false, error }
  }
}
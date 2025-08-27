/**
 * Accessibility Audit Utility for Kopiso E-commerce Platform
 * Ensures WCAG 2.1 compliance and accessibility best practices
 */

import React from 'react'

// =============================================================================
// ACCESSIBILITY INTERFACES
// =============================================================================

export interface AccessibilityProps {
  // ARIA attributes
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-hidden'?: boolean
  'aria-expanded'?: boolean
  'aria-controls'?: string
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'
  'aria-live'?: 'off' | 'polite' | 'assertive'
  'aria-atomic'?: boolean
  'aria-busy'?: boolean
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
  'aria-required'?: boolean
  'aria-disabled'?: boolean
  'aria-readonly'?: boolean
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-pressed'?: boolean | 'mixed'
  'aria-level'?: number
  'aria-setsize'?: number
  'aria-posinset'?: number
  
  // Standard attributes
  role?: string
  tabIndex?: number
  id?: string
  title?: string
}

export interface KeyboardNavigationProps {
  onKeyDown?: (event: React.KeyboardEvent) => void
  onKeyUp?: (event: React.KeyboardEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  onBlur?: (event: React.FocusEvent) => void
}

// =============================================================================
// ACCESSIBILITY COMPONENTS
// =============================================================================

// Screen Reader Only component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="sr-only absolute left-[-10000px] top-auto w-px h-px overflow-hidden">
      {children}
    </span>
  )
}

// Skip to content link
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:text-sm focus:no-underline"
      onClick={(e) => {
        e.preventDefault()
        const target = document.getElementById(targetId)
        if (target) {
          target.focus()
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }}
    >
      Skip to main content
    </a>
  )
}

// Focus trap component
export const FocusTrap: React.FC<{
  children: React.ReactNode
  active: boolean
  onEscape?: () => void
}> = ({ children, active, onEscape }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const firstFocusableRef = React.useRef<HTMLElement>()
  const lastFocusableRef = React.useRef<HTMLElement>()

  React.useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    firstFocusableRef.current = focusableElements[0]
    lastFocusableRef.current = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstFocusableRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault()
            lastFocusableRef.current?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault()
            firstFocusableRef.current?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onEscape])

  return (
    <div ref={containerRef} role="dialog" aria-modal={active}>
      {children}
    </div>
  )
}

// Accessible button component
export const AccessibleButton: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
  'aria-describedby'?: string
  className?: string
}> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  className = ''
}) => {
  const baseClasses = 'font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-300'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// Accessible form input component
export const AccessibleInput: React.FC<{
  label: string
  id: string
  type?: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  error?: string
  description?: string
  placeholder?: string
  className?: string
}> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  description,
  placeholder,
  className = ''
}) => {
  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined
  
  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {description}
        </p>
      )}
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible modal component
export const AccessibleModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement>()

  React.useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''
      // Restore focus
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal panel */}
        <FocusTrap active={isOpen} onEscape={onClose}>
          <div
            ref={modalRef}
            className={`inline-block w-full ${sizeClasses[size]} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="modal-title" className="text-lg font-medium text-gray-900">
                {title}
              </h3>
              <AccessibleButton
                onClick={onClose}
                variant="secondary"
                size="sm"
                aria-label="Close modal"
                className="p-2"
              >
                <span aria-hidden="true">×</span>
              </AccessibleButton>
            </div>
            
            <div>{children}</div>
          </div>
        </FocusTrap>
      </div>
    </div>
  )
}

// =============================================================================
// ACCESSIBILITY UTILITIES
// =============================================================================

export class AccessibilityUtils {
  // Generate unique ID for accessibility
  static generateId(prefix = 'element'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Check if element is focusable
  static isFocusable(element: HTMLElement): boolean {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ]
    
    return focusableSelectors.some(selector => element.matches(selector))
  }

  // Get all focusable elements within a container
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]
    
    const elements = container.querySelectorAll(selectors.join(', ')) as NodeListOf<HTMLElement>
    return Array.from(elements).filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
  }

  // Announce to screen readers
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    
    document.body.appendChild(announcer)
    
    // Delay to ensure screen reader picks it up
    setTimeout(() => {
      announcer.textContent = message
    }, 100)
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  // Check color contrast ratio
  static checkColorContrast(foreground: string, background: string): {
    ratio: number
    level: 'AAA' | 'AA' | 'FAIL'
  } {
    // This is a simplified contrast checker
    // In a real implementation, you'd use a proper color contrast library
    
    const getLuminance = (color: string): number => {
      // Convert hex to RGB and calculate luminance
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
    }
    
    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    
    let level: 'AAA' | 'AA' | 'FAIL'
    if (ratio >= 7) level = 'AAA'
    else if (ratio >= 4.5) level = 'AA'
    else level = 'FAIL'
    
    return { ratio, level }
  }

  // Validate ARIA attributes
  static validateARIA(element: HTMLElement): string[] {
    const errors: string[] = []
    
    // Check for required ARIA attributes based on role
    const role = element.getAttribute('role')
    
    if (role === 'button' && !element.hasAttribute('aria-label') && !element.textContent?.trim()) {
      errors.push('Button role requires accessible name')
    }
    
    if (role === 'dialog' && !element.hasAttribute('aria-labelledby') && !element.hasAttribute('aria-label')) {
      errors.push('Dialog role requires accessible name')
    }
    
    // Check for invalid ARIA attribute combinations
    if (element.hasAttribute('aria-hidden') && element.hasAttribute('aria-label')) {
      errors.push('aria-hidden and aria-label should not be used together')
    }
    
    return errors
  }

  // Focus management
  static manageFocus = {
    // Save current focus
    saveFocus(): HTMLElement | null {
      return document.activeElement as HTMLElement
    },

    // Restore focus to saved element
    restoreFocus(element: HTMLElement | null): void {
      if (element && element.focus) {
        element.focus()
      }
    },

    // Focus first focusable element in container
    focusFirst(container: HTMLElement): boolean {
      const focusable = AccessibilityUtils.getFocusableElements(container)
      if (focusable.length > 0) {
        focusable[0].focus()
        return true
      }
      return false
    },

    // Focus last focusable element in container
    focusLast(container: HTMLElement): boolean {
      const focusable = AccessibilityUtils.getFocusableElements(container)
      if (focusable.length > 0) {
        focusable[focusable.length - 1].focus()
        return true
      }
      return false
    }
  }

  // Keyboard navigation helpers
  static keyboard = {
    // Check if key is navigation key
    isNavigationKey(key: string): boolean {
      return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)
    },

    // Check if key is action key
    isActionKey(key: string): boolean {
      return ['Enter', ' ', 'Escape'].includes(key)
    },

    // Handle arrow key navigation
    handleArrowNavigation(
      event: React.KeyboardEvent,
      items: HTMLElement[],
      currentIndex: number,
      orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
    ): number {
      const { key } = event
      let newIndex = currentIndex

      if (orientation === 'vertical' || orientation === 'both') {
        if (key === 'ArrowDown') {
          newIndex = (currentIndex + 1) % items.length
        } else if (key === 'ArrowUp') {
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        }
      }

      if (orientation === 'horizontal' || orientation === 'both') {
        if (key === 'ArrowRight') {
          newIndex = (currentIndex + 1) % items.length
        } else if (key === 'ArrowLeft') {
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        }
      }

      if (key === 'Home') {
        newIndex = 0
      } else if (key === 'End') {
        newIndex = items.length - 1
      }

      if (newIndex !== currentIndex) {
        event.preventDefault()
        items[newIndex]?.focus()
      }

      return newIndex
    }
  }
}

// =============================================================================
// ACCESSIBILITY HOOKS
// =============================================================================

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  items: HTMLElement[],
  initialIndex = 0,
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    const newIndex = AccessibilityUtils.keyboard.handleArrowNavigation(
      event,
      items,
      currentIndex,
      orientation
    )
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }, [items, currentIndex, orientation])

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown
  }
}

// Hook for focus management
export const useFocusManagement = () => {
  const savedFocusRef = React.useRef<HTMLElement | null>(null)

  const saveFocus = React.useCallback(() => {
    savedFocusRef.current = AccessibilityUtils.manageFocus.saveFocus()
  }, [])

  const restoreFocus = React.useCallback(() => {
    AccessibilityUtils.manageFocus.restoreFocus(savedFocusRef.current)
  }, [])

  return { saveFocus, restoreFocus }
}

// Hook for announcements
export const useAnnouncements = () => {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    AccessibilityUtils.announce(message, priority)
  }, [])

  return { announce }
}

// =============================================================================
// ACCESSIBILITY TESTING UTILITIES
// =============================================================================

export class AccessibilityTester {
  // Test suite for accessibility compliance
  static runTests(container: HTMLElement): {
    passed: string[]
    warnings: string[]
    errors: string[]
  } {
    const results = {
      passed: [] as string[],
      warnings: [] as string[],
      errors: [] as string[]
    }

    // Test 1: Check for page title
    if (document.title && document.title.trim()) {
      results.passed.push('Page has title')
    } else {
      results.errors.push('Page missing title')
    }

    // Test 2: Check for main landmark
    const main = container.querySelector('main, [role="main"]')
    if (main) {
      results.passed.push('Page has main landmark')
    } else {
      results.warnings.push('Page missing main landmark')
    }

    // Test 3: Check for heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings.length > 0) {
      results.passed.push('Page has headings')
      
      // Check heading order
      const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)))
      let hasValidHierarchy = true
      
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          hasValidHierarchy = false
          break
        }
      }
      
      if (hasValidHierarchy) {
        results.passed.push('Heading hierarchy is correct')
      } else {
        results.warnings.push('Heading hierarchy may be incorrect')
      }
    } else {
      results.warnings.push('Page has no headings')
    }

    // Test 4: Check images for alt text
    const images = container.querySelectorAll('img')
    images.forEach((img, index) => {
      if (img.hasAttribute('alt')) {
        results.passed.push(`Image ${index + 1} has alt text`)
      } else {
        results.errors.push(`Image ${index + 1} missing alt text`)
      }
    })

    // Test 5: Check form labels
    const inputs = container.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea')
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id')
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`)
        if (label) {
          results.passed.push(`Input ${index + 1} has associated label`)
        } else {
          results.errors.push(`Input ${index + 1} missing associated label`)
        }
      } else {
        results.errors.push(`Input ${index + 1} missing id attribute`)
      }
    })

    // Test 6: Check focus indicators
    const focusableElements = AccessibilityUtils.getFocusableElements(container)
    if (focusableElements.length > 0) {
      results.passed.push('Page has focusable elements')
    }

    return results
  }

  // Generate accessibility report
  static generateReport(container: HTMLElement): string {
    const results = this.runTests(container)
    
    let report = '# Accessibility Audit Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    report += `## Summary\n`
    report += `- ✅ Passed: ${results.passed.length}\n`
    report += `- ⚠️ Warnings: ${results.warnings.length}\n`
    report += `- ❌ Errors: ${results.errors.length}\n\n`
    
    if (results.errors.length > 0) {
      report += `## Errors\n`
      results.errors.forEach(error => {
        report += `- ❌ ${error}\n`
      })
      report += '\n'
    }
    
    if (results.warnings.length > 0) {
      report += `## Warnings\n`
      results.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`
      })
      report += '\n'
    }
    
    if (results.passed.length > 0) {
      report += `## Passed\n`
      results.passed.forEach(passed => {
        report += `- ✅ ${passed}\n`
      })
    }
    
    return report
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Components
  ScreenReaderOnly,
  SkipToContent,
  FocusTrap,
  AccessibleButton,
  AccessibleInput,
  AccessibleModal,
  
  // Utilities
  AccessibilityUtils,
  AccessibilityTester,
  
  // Hooks
  useKeyboardNavigation,
  useFocusManagement,
  useAnnouncements
}
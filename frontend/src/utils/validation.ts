export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationErrors {
  [key: string]: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const URL_REGEX = /^https?:\/\/.+/
const PHONE_REGEX = /^[\d+\-\s()]+$/

export const validationRules = {
  email: {
    required: true,
    pattern: EMAIL_REGEX,
    custom: (value: string) => {
      if (!EMAIL_REGEX.test(value)) return 'Invalid email address'
      return true
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!PASSWORD_REGEX.test(value)) {
        return 'Password must contain uppercase, lowercase, number, and special character'
      }
      return true
    }
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'First name can only contain letters'
      return true
    }
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Last name can only contain letters'
      return true
    }
  },
  phone: {
    pattern: PHONE_REGEX,
    custom: (value: string) => {
      if (!PHONE_REGEX.test(value)) return 'Invalid phone number'
      return true
    }
  },
  company: {
    minLength: 2,
    maxLength: 100
  },
  price: {
    required: true,
    custom: (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num) || num < 0) return 'Price must be a positive number'
      return true
    }
  },
  quantity: {
    required: true,
    custom: (value: number | string) => {
      const num = typeof value === 'string' ? parseInt(value) : value
      if (isNaN(num) || num <= 0) return 'Quantity must be a positive integer'
      return true
    }
  },
  url: {
    pattern: URL_REGEX,
    custom: (value: string) => {
      if (!URL_REGEX.test(value)) return 'URL must start with http:// or https://'
      return true
    }
  }
}

export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required && (value === undefined || value === null || value === '')) {
    return 'This field is required'
  }

  if (value === undefined || value === null || value === '') {
    return null
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `Minimum length is ${rules.minLength} characters`
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `Maximum length is ${rules.maxLength} characters`
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return 'Invalid format'
  }

  if (rules.custom) {
    const result = rules.custom(value)
    if (result !== true) return result
  }

  return null
}

export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const [key, rule] of Object.entries(rules)) {
    const error = validateField(data[key], rule)
    if (error) {
      errors[key] = error
    }
  }

  return errors
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(error => error !== null && error !== '')
}

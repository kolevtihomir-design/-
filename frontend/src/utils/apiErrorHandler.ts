import axios, { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status: number
  code?: string
  details?: any
}

export class ApiErrorHandler {
  static parse(error: any): ApiError {
    const axiosError = error as AxiosError<any>

    if (axiosError.response) {
      const status = axiosError.response.status
      const data = axiosError.response.data

      let message = 'An error occurred'
      let code = undefined

      if (typeof data === 'object' && data !== null) {
        if ('message' in data) message = data.message
        if ('detail' in data) message = data.detail
        if ('error' in data) message = data.error
        if ('code' in data) code = data.code
      }

      return {
        message: message || `Error: ${status}`,
        status,
        code,
        details: data
      }
    }

    if (axiosError.request) {
      return {
        message: 'No response from server. Check your connection.',
        status: 0,
        code: 'NETWORK_ERROR'
      }
    }

    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
      code: 'UNKNOWN_ERROR'
    }
  }

  static getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad request. Please check your input.',
      401: 'Unauthorized. Please log in again.',
      403: 'Forbidden. You do not have permission.',
      404: 'Not found.',
      409: 'Conflict. Resource already exists.',
      422: 'Validation error. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Bad gateway. Please try again later.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. Please try again later.'
    }
    return messages[status] || 'An error occurred'
  }

  static isRetryable(status: number): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(status)
  }

  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error

        const apiError = this.parse(error)
        const shouldRetry = this.isRetryable(apiError.status) && attempt < maxRetries

        if (!shouldRetry) {
          throw error
        }

        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

export function getErrorMessage(error: any): string {
  const parsed = ApiErrorHandler.parse(error)
  return parsed.message || ApiErrorHandler.getStatusMessage(parsed.status)
}

export function isNetworkError(error: any): boolean {
  const parsed = ApiErrorHandler.parse(error)
  return parsed.code === 'NETWORK_ERROR' || parsed.status === 0
}

export function isAuthError(error: any): boolean {
  const parsed = ApiErrorHandler.parse(error)
  return parsed.status === 401 || parsed.status === 403
}

export function isValidationError(error: any): boolean {
  const parsed = ApiErrorHandler.parse(error)
  return parsed.status === 422 || parsed.status === 400
}

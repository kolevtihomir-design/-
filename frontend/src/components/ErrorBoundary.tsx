import React, { ReactNode } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <FiAlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className="mt-4 text-left bg-red-50 p-3 rounded border border-red-200 mb-4">
                <summary className="cursor-pointer font-semibold text-red-700">Error details</summary>
                <pre className="text-xs text-red-600 mt-2 overflow-auto">{this.state.error.toString()}</pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

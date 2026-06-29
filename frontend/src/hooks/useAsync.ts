import { useState, useCallback, useEffect } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  dependencies?: any[]
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error })
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies ? dependencies : [execute])

  return { ...state, execute }
}

export function useAsyncCallback<Args extends any[], T>(
  asyncFunction: (...args: Args) => Promise<T>
): {
  execute: (...args: Args) => Promise<T>
  data: T | null
  loading: boolean
  error: Error | null
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null })
      try {
        const response = await asyncFunction(...args)
        setState({ data: response, loading: false, error: null })
        return response
      } catch (error) {
        const err = error as Error
        setState({ data: null, loading: false, error: err })
        throw err
      }
    },
    [asyncFunction]
  )

  return { execute, ...state }
}

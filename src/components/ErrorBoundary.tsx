'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('Caught error in ErrorBoundary:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('VideoPlayer Error Boundary caught:', error.name, error.message)
    console.error('Error info:', errorInfo)
    
    // removeChild エラーは無視して回復
    if (error.name === 'NotFoundError' && error.message.includes('removeChild')) {
      console.log('Ignoring removeChild error and attempting recovery')
      // 少し遅れて回復を試行
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined })
      }, 100)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">動画の読み込みエラー</h3>
            <p className="text-gray-300 mb-4">動画を読み込めませんでした。</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                // window.location.reloadの代わりにステートリセットのみ
              }}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>再読み込み</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
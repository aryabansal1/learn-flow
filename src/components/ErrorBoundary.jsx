import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700 text-sm">
          <p className="font-semibold mb-1">Something went wrong</p>
          <p className="text-xs text-red-500">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

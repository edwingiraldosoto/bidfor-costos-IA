export function Card({ children, className = '', hover = true }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${hover ? 'hover:shadow-md' : ''} transition-shadow ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-6 pt-6 border-t border-slate-200 flex items-center gap-3 ${className}`}>
      {children}
    </div>
  )
}

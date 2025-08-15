export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo skeleton */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse"></div>
          </div>
          <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded w-64 mx-auto animate-pulse"></div>
        </div>
        
        {/* Form skeleton */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-white/20 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-12 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-white/20 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-12 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-12 bg-white/30 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function BuyersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        
        {/* Search and filters skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="bg-gray-200 h-12 mb-4"></div>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="border-t border-gray-200 p-4">
              <div className="flex flex-col space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/5"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination skeleton */}
        <div className="mt-8 flex justify-between">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerEditLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
            <div className="h-10 bg-gray-200 rounded w-24 mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Buyer Not Found</h2>
        <p className="mt-2 text-lg text-gray-600">
          The buyer lead you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <div className="mt-6">
          <Link 
            href="/buyers" 
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Buyer List
          </Link>
        </div>
      </div>
    </div>
  );
}

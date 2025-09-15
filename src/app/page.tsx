import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession();

  // Redirect authenticated users to the buyers list
  if (session) {
    redirect("/buyers");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Buyer Lead Intake App
        </h1>
        <p className="text-xl mb-8 max-w-2xl">
          A simple application to capture, list, and manage buyer leads with validation, search/filter,
          and CSV import/export.
        </p>
        <div className="flex flex-row justify-center space-x-4">
          <Link
            href="/auth/signin"
            className="rounded-md bg-indigo-600 px-5 py-3 text-white transition-colors hover:bg-indigo-700"
          >
            Sign In
          </Link>
          <a
            href="https://github.com/theshivay/Buyer-Lead-Intake"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-gray-100 px-5 py-3 text-gray-800 transition-colors hover:bg-gray-200"
          >
            View Source
          </a>
        </div>
      </main>
    </div>
  );
}

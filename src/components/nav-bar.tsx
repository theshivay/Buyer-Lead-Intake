import Link from "next/link";
import { getServerSession } from "next-auth";
import SignOutButton from "./sign-out-button";

export default async function NavBar() {
  const session = await getServerSession();
  const isAuthenticated = !!session;
  const userName = session?.user?.name;

  return (
    <nav className="bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">
                Buyer Lead Intake
              </Link>
            </div>
            {isAuthenticated && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/buyers"
                  className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Buyers
                </Link>
                <Link
                  href="/buyers/new"
                  className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Add New
                </Link>
                <Link
                  href="/buyers/import"
                  className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Import CSV
                </Link>
              </div>
            )}
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {userName && (
                  <span className="text-white text-sm">
                    Welcome, {userName}
                  </span>
                )}
                <SignOutButton />
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

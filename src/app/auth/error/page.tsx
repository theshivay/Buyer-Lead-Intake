export default function AuthError({ error }: { error?: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Authentication Error
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {error || "An error occurred during authentication. Please try again."}
        </p>
        <div className="mt-8 text-center">
          <a
            href="/auth/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}

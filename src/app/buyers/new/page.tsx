import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import BuyerForm from "@/components/forms/buyer-form";
import Link from "next/link";

export default async function NewBuyerPage() {
  const session = await getServerSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Buyer Lead</h1>
        <Link 
          href="/buyers"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to List
        </Link>
      </div>
      <BuyerForm />
    </div>
  );
}

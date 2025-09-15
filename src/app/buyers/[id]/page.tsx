import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import BuyerForm from "@/components/forms/buyer-form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function BuyerPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Await params before using them
  const params = await paramsPromise;
  const buyerId = params.id;
  
  // Fetch buyer data
  const buyer = await prisma.buyer.findUnique({
    where: { id: buyerId },
  });

  // Return 404 if buyer not found
  if (!buyer) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Buyer Lead</h1>
        <Link 
          href="/buyers"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to List
        </Link>
      </div>
      <BuyerForm initialData={JSON.parse(JSON.stringify(buyer))} isEditing={true} />
    </div>
  );
}

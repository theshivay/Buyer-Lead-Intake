import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CSVImport from "@/components/buyers/csv-import";
import Link from "next/link";

export default async function ImportBuyersPage() {
  const session = await getServerSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Buyer Leads from CSV</h1>
        <Link 
          href="/buyers"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to List
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">CSV Format Instructions</h2>
        <p className="mb-2">Your CSV file should have the following columns:</p>
        <ul className="list-disc ml-6 mb-4 text-sm">
          <li><strong>fullName</strong> (required): Full name of the buyer</li>
          <li><strong>email</strong> (required): Email address</li>
          <li><strong>phone</strong> (optional): Phone number</li>
          <li><strong>city</strong> (optional): City (Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Pune)</li>
          <li><strong>propertyType</strong> (optional): Property type (Apartment, Villa, Plot, Commercial)</li>
          <li><strong>bhk</strong> (optional): Number of bedrooms (1, 2, 3, 4+)</li>
          <li><strong>budgetMin</strong> (optional): Minimum budget in lakhs (numeric)</li>
          <li><strong>budgetMax</strong> (optional): Maximum budget in lakhs (numeric)</li>
          <li><strong>timeline</strong> (optional): Purchase timeline (Ready, 0-3 Months, 3-6 Months, 6+ Months)</li>
          <li><strong>notes</strong> (optional): Additional notes</li>
        </ul>
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> First row should contain column headers. Invalid rows will be highlighted with errors.
        </p>
      </div>
      
      <CSVImport />
    </div>
  );
}

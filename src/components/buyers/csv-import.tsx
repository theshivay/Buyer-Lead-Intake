"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ImportError {
  row: number;
  errors: Record<string, { _errors: string[] }>;
}

export default function CsvImportForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if file is CSV
    if (!selectedFile.name.endsWith('.csv')) {
      setError("Please select a CSV file.");
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors([]);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/buyers/csv", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.invalidRows) {
          setValidationErrors(data.invalidRows);
          setError(`Found errors in ${data.invalidRows.length} rows.`);
        } else {
          throw new Error(data.error || "Failed to import file");
        }
        return;
      }
      
      setSuccess(`Successfully imported ${data.count} buyers.`);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.push("/buyers");
        router.refresh();
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during import");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Import Buyers from CSV</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-800">
          <p className="font-medium">Success</p>
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
            CSV File (max 200 rows)
          </label>
          <input
            id="csv-file"
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            disabled={isUploading}
          />
          <p className="mt-1 text-sm text-gray-500">
            File must include headers: fullName, email, phone, city, propertyType, bhk, purpose, budgetMin, budgetMax, timeline, source, notes, tags, status
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isUploading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isUploading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </form>
      
      {/* Validation Errors Table */}
      {validationErrors.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Validation Errors</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Row
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Field
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationErrors.flatMap((rowError) => {
                  // Extract field errors for each row
                  return Object.entries(rowError.errors)
                    .filter(([field]) => field !== "_errors") // Skip top-level errors
                    .flatMap(([field, fieldErrors]) => {
                      // Each field might have multiple error messages
                      return fieldErrors._errors.map((errorMsg, idx) => (
                        <tr key={`${rowError.row}-${field}-${idx}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rowError.row}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {field}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            {errorMsg}
                          </td>
                        </tr>
                      ));
                    });
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-md font-medium mb-2">CSV Format Example:</h3>
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
          fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
          <br />
          John Doe,john@example.com,9876543210,Chandigarh,Apartment,2,Buy,5000000,7000000,0-3m,Website,Looking for 2 BHK,urgent/follow-up,New
          <br />
          Jane Smith,jane@example.com,8765432109,Mohali,Villa,3,Rent,15000,25000,3-6m,Referral,Needs parking space,premium/verified,Contacted
        </pre>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { City, PropertyType, Status, Timeline, TimelineDisplay } from "@/lib/validation";

interface Buyer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: City;
  propertyType: PropertyType;
  bhk: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: Timeline;
  status: Status;
  updatedAt: string;
  tags?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BuyerListProps {
  initialBuyers: Buyer[];
  pagination: PaginationInfo;
  cities: City[];
  propertyTypes: PropertyType[];
  statuses: Status[];
  timelines: Timeline[];
}

export default function BuyerList({
  initialBuyers,
  pagination,
  cities,
  propertyTypes,
  statuses,
  timelines,
}: BuyerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [buyers] = useState<Buyer[]>(initialBuyers);
  const [paginationInfo] = useState<PaginationInfo>(pagination);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [timeline, setTimeline] = useState(searchParams.get("timeline") || "");
  
  // Handle search input with debounce
  let debounceTimeout: NodeJS.Timeout | null = null;
  
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    debounceTimeout = setTimeout(() => {
      updateQueryParams({ search: value || undefined });
    }, 500);
  };
  
  // Handle filter changes
  const handleFilterChange = (filter: string, value: string) => {
    switch (filter) {
      case "city":
        setCity(value);
        break;
      case "propertyType":
        setPropertyType(value);
        break;
      case "status":
        setStatus(value);
        break;
      case "timeline":
        setTimeline(value);
        break;
      default:
        break;
    }
    
    updateQueryParams({ [filter]: value || undefined });
  };
  
  // Update URL query parameters and fetch new data
  const updateQueryParams = (params: Record<string, string | undefined>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    
    // Update provided parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change
    if (!("page" in params)) {
      currentParams.set("page", "1");
    }
    
    const newQueryString = currentParams.toString();
    router.push(`/buyers?${newQueryString}`);
  };
  
  // Handle pagination
  const changePage = (page: number) => {
    if (page < 1 || page > paginationInfo.totalPages) return;
    updateQueryParams({ page: page.toString() });
  };
  
  // Export CSV with current filters
  const exportCSV = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const queryString = currentParams.toString();
    window.open(`/api/buyers/csv?${queryString}`, "_blank");
  };
  
  // Format currency (Indian Rupees)
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format budget range
  const formatBudgetRange = (min: number | null, max: number | null) => {
    if (min === null && max === null) return "-";
    if (min === null) return `≤ ${formatCurrency(max)}`;
    if (max === null) return `≥ ${formatCurrency(min)}`;
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };
  
  // Map timeline enum to display value
  const formatTimeline = (timeline: Timeline) => {
    return TimelineDisplay[timeline];
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                type="search"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search by name, email, or phone"
              />
            </div>
          </div>
          
          <div>
            <select
              value={city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Cities</option>
              {cities.map((cityOption) => (
                <option key={cityOption} value={cityOption}>
                  {cityOption}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={propertyType}
              onChange={(e) => handleFilterChange("propertyType", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Properties</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              {statuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={timeline}
              onChange={(e) => handleFilterChange("timeline", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Timelines</option>
              {timelines.map((timelineOption) => (
                <option key={timelineOption} value={timelineOption}>
                  {formatTimeline(timelineOption)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Export CSV
          </button>
        </div>
        <Link
          href="/buyers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Lead
        </Link>
      </div>
      
      {/* Buyers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                City
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Property
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Budget
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Timeline
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Updated
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {buyers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  No buyers found matching your filters
                </td>
              </tr>
            ) : (
              buyers.map((buyer) => (
                <tr key={buyer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{buyer.fullName}</div>
                    {buyer.email && (
                      <div className="text-sm text-gray-500">{buyer.email}</div>
                    )}
                    {buyer.tags && buyer.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {buyer.tags.split(',').filter(Boolean).map(tag => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{buyer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{buyer.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{buyer.propertyType}</div>
                    {buyer.bhk && (
                      <div className="text-sm text-gray-500">{buyer.bhk}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBudgetRange(buyer.budgetMin, buyer.budgetMax)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeline(buyer.timeline)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        buyer.status === "New"
                          ? "bg-blue-100 text-blue-800"
                          : buyer.status === "Qualified"
                          ? "bg-green-100 text-green-800"
                          : buyer.status === "Contacted"
                          ? "bg-indigo-100 text-indigo-800"
                          : buyer.status === "Visited"
                          ? "bg-purple-100 text-purple-800"
                          : buyer.status === "Negotiation"
                          ? "bg-yellow-100 text-yellow-800"
                          : buyer.status === "Converted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {buyer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(buyer.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/buyers/${buyer.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(paginationInfo.page - 1) * paginationInfo.limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.totalCount)}
                </span>{" "}
                of <span className="font-medium">{paginationInfo.totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => changePage(paginationInfo.page - 1)}
                  disabled={!paginationInfo.hasPrevPage}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                    paginationInfo.hasPrevPage
                      ? "hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      : "cursor-not-allowed"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                  // Show current page and surrounding pages
                  const pageNum = Math.min(
                    Math.max(paginationInfo.page - 2 + i, 1),
                    paginationInfo.totalPages
                  );
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === paginationInfo.page
                          ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => changePage(paginationInfo.page + 1)}
                  disabled={!paginationInfo.hasNextPage}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                    paginationInfo.hasNextPage
                      ? "hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      : "cursor-not-allowed"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

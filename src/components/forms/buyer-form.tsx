"use client";

import { BuyerFormValues, buyerFormSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BuyerFormProps {
  initialData?: BuyerFormValues;
  isEditing?: boolean;
}

export default function BuyerForm({ initialData, isEditing = false }: BuyerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(initialData?.tags ? initialData.tags.split(',').filter(Boolean) : []);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: initialData || {
      fullName: "",
      email: "",
      phone: "",
      city: undefined,
      propertyType: undefined,
      bhk: undefined,
      purpose: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      timeline: undefined,
      source: undefined,
      notes: "",
      tags: "",
      status: "New",
    },
  });

  // Watch propertyType to conditionally render BHK field
  const propertyType = watch("propertyType");
  const isResidential = propertyType === "Apartment" || propertyType === "Villa";

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Include tags from the state as comma-separated string
      data.tags = tags.join(',');
      
      const formDataToSend = {
        ...data,
        // Handle the form data to match the schema
        budgetMin: data.budgetMin !== "" ? data.budgetMin : null,
        budgetMax: data.budgetMax !== "" ? data.budgetMax : null,
      };
      
      if (isEditing && initialData?.id) {
        // Update existing buyer
        const response = await fetch(`/api/buyers/${initialData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formDataToSend,
            updatedAt: initialData.updatedAt,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update buyer");
        }
      } else {
        // Create new buyer
        const response = await fetch("/api/buyers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formDataToSend),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create buyer");
        }
      }

      router.push("/buyers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleTagAdd();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name*
            </label>
            <input
              id="fullName"
              type="text"
              {...register("fullName")}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.fullName ? "border-red-500" : ""
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600" id="fullName-error">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" id="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone*
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.phone ? "border-red-500" : ""
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600" id="phone-error">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City*
            </label>
            <select
              id="city"
              {...register("city")}
              aria-describedby={errors.city ? "city-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.city ? "border-red-500" : ""
              }`}
            >
              <option value="">Select City</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Mohali">Mohali</option>
              <option value="Zirakpur">Zirakpur</option>
              <option value="Panchkula">Panchkula</option>
              <option value="Other">Other</option>
            </select>
            {errors.city && (
              <p className="mt-1 text-sm text-red-600" id="city-error">
                {errors.city.message}
              </p>
            )}
          </div>
        </div>

        {/* Property Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
              Property Type*
            </label>
            <select
              id="propertyType"
              {...register("propertyType")}
              aria-describedby={errors.propertyType ? "propertyType-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.propertyType ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Property Type</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
              <option value="Office">Office</option>
              <option value="Retail">Retail</option>
            </select>
            {errors.propertyType && (
              <p className="mt-1 text-sm text-red-600" id="propertyType-error">
                {errors.propertyType.message}
              </p>
            )}
          </div>

          {isResidential && (
            <div>
              <label htmlFor="bhk" className="block text-sm font-medium text-gray-700">
                BHK*
              </label>
              <select
                id="bhk"
                {...register("bhk")}
                aria-describedby={errors.bhk ? "bhk-error" : undefined}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.bhk ? "border-red-500" : ""
                }`}
              >
                <option value="">Select BHK</option>
                <option value="Studio">Studio</option>
                <option value="One">1 BHK</option>
                <option value="Two">2 BHK</option>
                <option value="Three">3 BHK</option>
                <option value="Four">4 BHK</option>
              </select>
              {errors.bhk && (
                <p className="mt-1 text-sm text-red-600" id="bhk-error">
                  {errors.bhk.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
              Purpose*
            </label>
            <select
              id="purpose"
              {...register("purpose")}
              aria-describedby={errors.purpose ? "purpose-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.purpose ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Purpose</option>
              <option value="Buy">Buy</option>
              <option value="Rent">Rent</option>
            </select>
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600" id="purpose-error">
                {errors.purpose.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700">
                Budget Min (INR)
              </label>
              <input
                id="budgetMin"
                type="number"
                {...register("budgetMin", { valueAsNumber: true })}
                aria-describedby={errors.budgetMin ? "budgetMin-error" : undefined}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.budgetMin ? "border-red-500" : ""
                }`}
              />
              {errors.budgetMin && (
                <p className="mt-1 text-sm text-red-600" id="budgetMin-error">
                  {errors.budgetMin.message}
                </p>
              )}
            </div>

            <div className="flex-1">
              <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700">
                Budget Max (INR)
              </label>
              <input
                id="budgetMax"
                type="number"
                {...register("budgetMax", { valueAsNumber: true })}
                aria-describedby={errors.budgetMax ? "budgetMax-error" : undefined}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.budgetMax ? "border-red-500" : ""
                }`}
              />
              {errors.budgetMax && (
                <p className="mt-1 text-sm text-red-600" id="budgetMax-error">
                  {errors.budgetMax.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">
              Timeline*
            </label>
            <select
              id="timeline"
              {...register("timeline")}
              aria-describedby={errors.timeline ? "timeline-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.timeline ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Timeline</option>
              <option value="ZeroToThreeMonths">0-3 months</option>
              <option value="ThreeToSixMonths">3-6 months</option>
              <option value="MoreThanSixMonths">&gt;6 months</option>
              <option value="Exploring">Exploring</option>
            </select>
            {errors.timeline && (
              <p className="mt-1 text-sm text-red-600" id="timeline-error">
                {errors.timeline.message}
              </p>
            )}
          </div>
        </div>

        {/* Source and Status */}
        <div className="space-y-4">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Source*
            </label>
            <select
              id="source"
              {...register("source")}
              aria-describedby={errors.source ? "source-error" : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.source ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Source</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="WalkIn">Walk-in</option>
              <option value="Call">Call</option>
              <option value="Other">Other</option>
            </select>
            {errors.source && (
              <p className="mt-1 text-sm text-red-600" id="source-error">
                {errors.source.message}
              </p>
            )}
          </div>

          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                {...register("status")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Contacted">Contacted</option>
                <option value="Visited">Visited</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Converted">Converted</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex-1">
                <input
                  id="tagInput"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleTagAdd}
                  placeholder="Add tags (press Enter)"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register("notes")}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.notes ? "border-red-500" : ""
          }`}
        ></textarea>
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600" id="notes-error">
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="pt-5 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

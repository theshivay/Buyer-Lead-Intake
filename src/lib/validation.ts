import { z } from "zod";

// Enums
export const CityEnum = z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]);
export type City = z.infer<typeof CityEnum>;

export const PropertyTypeEnum = z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]);
export type PropertyType = z.infer<typeof PropertyTypeEnum>;

export const BHKEnum = z.enum(["Studio", "One", "Two", "Three", "Four"]);
export type BHK = z.infer<typeof BHKEnum>;

export const PurposeEnum = z.enum(["Buy", "Rent"]);
export type Purpose = z.infer<typeof PurposeEnum>;

export const TimelineEnum = z.enum(["ZeroToThreeMonths", "ThreeToSixMonths", "MoreThanSixMonths", "Exploring"]);
export type Timeline = z.infer<typeof TimelineEnum>;

export const SourceEnum = z.enum(["Website", "Referral", "WalkIn", "Call", "Other"]);
export type Source = z.infer<typeof SourceEnum>;

export const StatusEnum = z.enum(["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"]);
export type Status = z.infer<typeof StatusEnum>;

// Mapping for display
export const TimelineDisplay: Record<Timeline, string> = {
  ZeroToThreeMonths: "0-3 months",
  ThreeToSixMonths: "3-6 months",
  MoreThanSixMonths: ">6 months",
  Exploring: "Exploring",
};

export const BHKDisplay: Record<BHK, string> = {
  Studio: "Studio",
  One: "1 BHK",
  Two: "2 BHK",
  Three: "3 BHK",
  Four: "4 BHK",
};

// Buyer schema for form validation
export const buyerFormSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }).max(80),
  email: z.string().email({ message: "Invalid email address" }).optional().nullable(),
  phone: z.string().min(10, { message: "Phone must be at least 10 digits" }).max(15),
  city: CityEnum,
  propertyType: PropertyTypeEnum,
  bhk: BHKEnum.optional().nullable(),
  purpose: PurposeEnum,
  budgetMin: z.number().int().positive().optional().nullable(),
  budgetMax: z.number().int().positive().optional().nullable(),
  timeline: TimelineEnum,
  source: SourceEnum,
  notes: z.string().max(1000, { message: "Notes cannot exceed 1000 characters" }).optional().nullable(),
  tags: z.string().optional().default("").transform(val => val ? val.split(",").filter(Boolean).map(tag => tag.trim()).join(",") : ""),
  status: StatusEnum.optional().default("New"),
  updatedAt: z.date().optional(),
})
.refine(
  (data) => {
    // BHK required only for Apartment and Villa
    if (["Apartment", "Villa"].includes(data.propertyType)) {
      return data.bhk !== null && data.bhk !== undefined;
    }
    return true;
  },
  {
    message: "BHK is required for Apartment and Villa property types",
    path: ["bhk"],
  }
)
.refine(
  (data) => {
    // budgetMax should be greater than or equal to budgetMin if both are present
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  }
);

export type BuyerFormValues = z.infer<typeof buyerFormSchema>;

// CSV import schema
export const buyerCsvRowSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).max(15),
  city: z.string().refine(val => ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"].includes(val), {
    message: "Invalid city value",
  }),
  propertyType: z.string().refine(val => ["Apartment", "Villa", "Plot", "Office", "Retail"].includes(val), {
    message: "Invalid property type",
  }),
  bhk: z.string().optional().nullable(),
  purpose: z.string().refine(val => ["Buy", "Rent"].includes(val), {
    message: "Invalid purpose value",
  }),
  budgetMin: z.string().optional().nullable().transform(val => val ? parseInt(val, 10) : null),
  budgetMax: z.string().optional().nullable().transform(val => val ? parseInt(val, 10) : null),
  timeline: z.string().refine(val => {
    // Map the CSV values to our enum
    const mapping: Record<string, boolean> = {
      "0-3m": true, 
      "3-6m": true, 
      ">6m": true, 
      "Exploring": true
    };
    return mapping[val] === true;
  }, {
    message: "Invalid timeline value",
  }),
  source: z.string().refine(val => ["Website", "Referral", "WalkIn", "Call", "Other", "Walk-in"].includes(val), {
    message: "Invalid source value",
  }),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.string().optional().default(""),
  status: z.string().refine(val => ["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"].includes(val), {
    message: "Invalid status value",
  }).optional().default("New"),
})
.refine(
  (data) => {
    // Convert string values to numbers for budget comparison
    const budgetMin = data.budgetMin ? Number(data.budgetMin) : null;
    const budgetMax = data.budgetMax ? Number(data.budgetMax) : null;
    
    // Check if budgetMax is greater than or equal to budgetMin if both exist
    if (budgetMin !== null && budgetMax !== null) {
      return budgetMax >= budgetMin;
    }
    return true;
  },
  {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  }
)
.refine(
  (data) => {
    // BHK is required for Apartment and Villa
    if (["Apartment", "Villa"].includes(data.propertyType)) {
      return data.bhk !== null && data.bhk !== undefined && data.bhk !== "";
    }
    return true;
  },
  {
    message: "BHK is required for Apartment and Villa property types",
    path: ["bhk"],
  }
);

export type BuyerCsvRow = z.infer<typeof buyerCsvRowSchema>;

// Query parameters for filtering and pagination
export const buyerQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  city: CityEnum.optional(),
  propertyType: PropertyTypeEnum.optional(),
  status: StatusEnum.optional(),
  timeline: TimelineEnum.optional(),
  sortBy: z.string().optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type BuyerQueryParams = z.infer<typeof buyerQuerySchema>;

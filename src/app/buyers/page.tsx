import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import BuyerList from "@/components/buyers/buyer-list";
import { prisma } from "@/lib/prisma";
import { City, PropertyType, Status, Timeline, CityEnum, PropertyTypeEnum, StatusEnum, TimelineEnum } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function BuyersPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    city?: City;
    propertyType?: PropertyType;
    status?: Status;
    timeline?: Timeline;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>;
}) {
  const session = await getServerSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }
  
  // Await the searchParams before using them
  const searchParams = await searchParamsPromise;

  // Parse search params
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = searchParams?.search || undefined;
  const city = searchParams?.city;
  const propertyType = searchParams?.propertyType;
  const status = searchParams?.status;
  const timeline = searchParams?.timeline;
  const sortBy = searchParams?.sortBy || "updatedAt";
  const sortOrder = searchParams?.sortOrder || "desc";

  // Build filter conditions
  const where: {
    OR?: Array<{
      fullName?: { contains: string };
      email?: { contains: string };
      phone?: { contains: string };
    }>;
    city?: City;
    propertyType?: PropertyType;
    status?: Status;
    timeline?: Timeline;
  } = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  if (city) where.city = city;
  if (propertyType) where.propertyType = propertyType;
  if (status) where.status = status;
  if (timeline) where.timeline = timeline;

  // Fetch buyers with pagination
  const [buyers, totalCount] = await Promise.all([
    prisma.buyer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        city: true,
        propertyType: true,
        bhk: true,
        budgetMin: true,
        budgetMax: true,
        timeline: true,
        status: true,
        tags: true,
        updatedAt: true,
      },
    }),
    prisma.buyer.count({ where }),
  ]);

  // Get enum values for filters
  const cities = Object.values(CityEnum.enum);
  const propertyTypes = Object.values(PropertyTypeEnum.enum);
  const statuses = Object.values(StatusEnum.enum);
  const timelines = Object.values(TimelineEnum.enum);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limit);

  const pagination = {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Buyer Leads</h1>
      <BuyerList
        initialBuyers={JSON.parse(JSON.stringify(buyers))}
        pagination={pagination}
        cities={cities as City[]}
        propertyTypes={propertyTypes as PropertyType[]}
        statuses={statuses as Status[]}
        timelines={timelines as Timeline[]}
      />
    </div>
  );
}

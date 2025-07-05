import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Tag, Star, Clock } from "lucide-react";

// Optional: Simple Skeleton component for reusability
function Skeleton({ className }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className}`} />;
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Section */}
      <header className="py-8 px-6 md:px-10">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-6 max-w-2xl" />
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-28" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Top Packages */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="text-green-400" size={20} />
                  Top Packages
                </CardTitle>
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Packages */}
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="text-orange-400" size={20} />
                  Recent Packages
                </CardTitle>
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {[1, 2, 3].map((item) => (
                  <div key={`recent-${item}`} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Popular Tags and Stats */}
          <div className="space-y-6">
            {/* Popular Tags */}
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="text-purple-500" size={20} />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex flex-wrap gap-2">
                  {Array(10).fill(0).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-16 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Package Stats */}
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="text-blue-500" size={20} />
                  Package Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={`stat-${item}`} className="bg-muted/50 p-4 rounded-lg animate-pulse">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Starred */}
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Star className="text-yellow-400" size={20} />
                  Most Starred
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6 space-y-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={`star-${item}`} className="h-8 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 
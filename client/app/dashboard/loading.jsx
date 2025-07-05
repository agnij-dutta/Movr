import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Tag, Star, Clock } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header Section */}
      <header className="py-8 px-6 md:px-10">
        <div className="flex flex-col gap-6">
          <div className="h-10 bg-[#1A1A1A] rounded-md w-60 animate-pulse" />
          <div className="h-6 bg-[#1A1A1A] rounded-md max-w-2xl animate-pulse" />
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <div className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />
            </div>
            <div className="h-12 bg-[#1A1A1A] rounded-md w-28 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Top Packages */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="text-[#4ADE80]" size={20} />
                  Top Packages
                </CardTitle>
                <div className="h-8 bg-[#1A1A1A] rounded-md w-20 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {[1, 2, 3, 4].map((item) => (
                  <div 
                    key={item}
                    className="flex flex-col gap-2 p-4 rounded-lg bg-[#1A1A1A]/50 animate-pulse"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-6 bg-[#1A1A1A] rounded-md w-32 mb-2" />
                        <div className="h-4 bg-[#1A1A1A] rounded-md w-64" />
                      </div>
                      <div className="h-6 bg-[#1A1A1A] rounded-full w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Packages */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="text-[#FB923C]" size={20} />
                  Recent Packages
                </CardTitle>
                <div className="h-8 bg-[#1A1A1A] rounded-md w-20 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {[1, 2, 3].map((item) => (
                  <div 
                    key={`recent-${item}`}
                    className="flex flex-col gap-2 p-4 rounded-lg bg-[#1A1A1A]/50 animate-pulse"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-6 bg-[#1A1A1A] rounded-md w-32 mb-2" />
                        <div className="h-4 bg-[#1A1A1A] rounded-md w-64" />
                      </div>
                      <div className="h-6 bg-[#1A1A1A] rounded-full w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Popular Tags and Stats */}
          <div className="space-y-6">
            {/* Popular Tags */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="text-[#A855F7]" size={20} />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex flex-wrap gap-2">
                  {Array(10).fill(0).map((_, index) => (
                    <div 
                      key={index}
                      className="h-8 bg-[#1A1A1A]/80 rounded-full w-16 animate-pulse"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Package Stats */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="text-[#3B82F6]" size={20} />
                  Package Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div 
                      key={`stat-${item}`}
                      className="bg-[#1A1A1A]/50 p-4 rounded-lg animate-pulse"
                    >
                      <div className="h-4 bg-[#1A1A1A] rounded-md w-20 mb-2" />
                      <div className="h-8 bg-[#1A1A1A] rounded-md w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Starred */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Star className="text-[#FDE047]" size={20} />
                  Most Starred
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div 
                    key={`star-${item}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#1A1A1A]/50 animate-pulse h-8"
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 
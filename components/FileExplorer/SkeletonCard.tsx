import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  viewMode: "grid" | "list";
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ viewMode }) => {
  return (
    <Card className="cursor-pointer">
      <CardContent className="p-4">
        {viewMode === "grid" && (
          <div className="aspect-video mb-2 bg-muted flex items-center justify-center overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SkeletonCard;
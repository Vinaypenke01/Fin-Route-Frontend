import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { TableRow, TableCell } from "@/components/ui/table";

export function TableSkeletonRows({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} className="border-b border-border/50">
          {Array.from({ length: columns }).map((_, c) => (
            <TableCell key={c} className="py-3.5">
              <Skeleton
                className={`h-4 bg-muted-foreground/15 rounded ${
                  c === 0 ? "w-28 sm:w-36" : c === columns - 1 ? "w-16 ml-auto" : "w-20 sm:w-28"
                }`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3 border-border/70 bg-card">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 bg-muted-foreground/20 rounded" />
            <Skeleton className="size-6 rounded-full bg-muted-foreground/15" />
          </div>
          <Skeleton className="h-7 w-28 bg-muted-foreground/25 rounded" />
          <Skeleton className="h-3 w-36 bg-muted-foreground/15 rounded" />
        </Card>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-2.5 border-border/70">
          <Skeleton className="h-3.5 w-28 bg-muted-foreground/20 rounded" />
          <Skeleton className="h-8 w-32 bg-primary/20 rounded" />
          <Skeleton className="h-3 w-40 bg-muted-foreground/15 rounded" />
        </Card>
      ))}
    </div>
  );
}

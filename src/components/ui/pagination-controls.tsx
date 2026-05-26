import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

type PaginationLabels = {
  previous: string;
  next: string;
};

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isRTL?: boolean;
  labels: PaginationLabels;
  className?: string;
  simple?: boolean;
};

const getVisiblePages = (page: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
};

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  isRTL,
  labels,
  className,
  simple,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(page, totalPages);
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  const handleClick = (nextPage: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (nextPage !== page) {
      onPageChange(nextPage);
    }
  };

  const goPrev = () => onPageChange(Math.max(1, page - 1));
  const goNext = () => onPageChange(Math.min(totalPages, page + 1));

  if (simple) {
    return (
      <Pagination className={className}>
        <PaginationContent className="gap-4">
          <PaginationItem>
            <PaginationLink
              href="#"
              className={cn("gap-1 px-4", isRTL && "flex-row-reverse", isPrevDisabled && "pointer-events-none opacity-50")}
              aria-disabled={isPrevDisabled}
              onClick={handleClick(Math.max(1, page - 1))}
            >
              {labels.previous}
            </PaginationLink>
          </PaginationItem>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <PaginationItem>
            <PaginationLink
              href="#"
              className={cn("gap-1 px-4", isRTL && "flex-row-reverse", isNextDisabled && "pointer-events-none opacity-50")}
              aria-disabled={isNextDisabled}
              onClick={handleClick(Math.min(totalPages, page + 1))}
            >
              {labels.next}
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  const renderPageItems = () => {
    const items: React.ReactNode[] = [];
    let lastPage = 0;

    pages.forEach((pageNumber) => {
      if (pageNumber - lastPage > 1) {
        items.push(
          <PaginationItem key={`ellipsis-${pageNumber}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={pageNumber}>
          <PaginationLink
            href="#"
            isActive={pageNumber === page}
            onClick={handleClick(pageNumber)}
          >
            {pageNumber}
          </PaginationLink>
        </PaginationItem>
      );

      lastPage = pageNumber;
    });

    return items;
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            className={cn("gap-1 px-3", isRTL && "flex-row-reverse", isPrevDisabled && "pointer-events-none opacity-50")}
            aria-disabled={isPrevDisabled}
            onClick={handleClick(Math.max(1, page - 1))}
          >
            {labels.previous}
          </PaginationLink>
        </PaginationItem>
        {renderPageItems()}
        <PaginationItem>
          <PaginationLink
            href="#"
            className={cn("gap-1 px-3", isRTL && "flex-row-reverse", isNextDisabled && "pointer-events-none opacity-50")}
            aria-disabled={isNextDisabled}
            onClick={handleClick(Math.min(totalPages, page + 1))}
          >
            {labels.next}
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

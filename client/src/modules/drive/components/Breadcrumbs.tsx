import { Fragment } from "react";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { BreadcrumbEntry } from "../types";

const MAX_VISIBLE_ENTRIES = 4;

interface BreadcrumbsProps {
  entries: BreadcrumbEntry[];
}

function labelFor(entry: BreadcrumbEntry, index: number): string {
  return index === 0 ? "My Drive" : entry.name;
}

export function Breadcrumbs({ entries }: BreadcrumbsProps) {
  const isCollapsed = entries.length > MAX_VISIBLE_ENTRIES;
  const hiddenEntries = isCollapsed ? entries.slice(1, -2) : [];
  const visibleEntries = isCollapsed
    ? [entries[0], ...entries.slice(-2)]
    : entries;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleEntries.map((entry, index) => {
          if (!entry) {
            return null;
          }
          const isLast = index === visibleEntries.length - 1;
          const showEllipsisBefore = isCollapsed && index === 1;
          const originalIndex = entries.findIndex((e) => e.id === entry.id);

          return (
            <Fragment key={entry.id}>
              {showEllipsisBefore && (
                <>
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="hover:bg-muted hover:text-foreground rounded">
                        <BreadcrumbEllipsis />
                        <span className="sr-only">Show hidden folders</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {hiddenEntries.map((hidden) => (
                          <DropdownMenuItem
                            key={hidden.id}
                            render={<Link to={`/drive/${hidden.id}`} />}
                          >
                            <span className="max-w-56 min-w-0 truncate">
                              {hidden.name}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>
                    {labelFor(entry, originalIndex)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={`/drive/${entry.id}`} />}>
                    {labelFor(entry, originalIndex)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

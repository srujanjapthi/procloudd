interface DriveColumnHeaderProps {
  showLocation?: boolean;
}

export function DriveColumnHeader({ showLocation }: DriveColumnHeaderProps) {
  return (
    <div className="text-muted-foreground hidden items-center gap-6 px-3 pb-1 text-xs font-medium lg:flex">
      <span className="w-5 shrink-0" />
      <span className="flex-1">Name</span>
      <span className="w-28 shrink-0">
        {showLocation ? "Location" : "Type"}
      </span>
      <span className="w-20 shrink-0 text-right">Size</span>
      <span className="w-32 shrink-0 text-right">Modified</span>
      <span className="flex shrink-0 items-center gap-0.5">
        <span className="size-7" />
        <span className="size-7" />
      </span>
    </div>
  );
}

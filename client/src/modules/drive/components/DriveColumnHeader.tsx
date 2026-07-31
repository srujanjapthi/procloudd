export function DriveColumnHeader() {
  return (
    <div className="text-muted-foreground hidden items-center gap-6 px-3 pb-1 text-xs font-medium lg:flex">
      <span className="w-5 shrink-0" />
      <span className="flex-1">Name</span>
      <span className="w-28 shrink-0">Type</span>
      <span className="w-20 shrink-0 text-right">Size</span>
      <span className="w-32 shrink-0 text-right">Modified</span>
      <span className="w-7 shrink-0" />
    </div>
  );
}

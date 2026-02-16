import { cn } from "../lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    provisioning: "bg-blue-100 text-blue-700 border-blue-200",
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    suspended: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const defaultStyle = "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider",
        styles[status] || defaultStyle,
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          status === "active"
            ? "bg-emerald-500 animate-pulse"
            : status === "provisioning"
              ? "bg-blue-500 animate-pulse"
              : status === "error"
                ? "bg-rose-500"
                : "bg-gray-400",
        )}
      />
      {status}
    </span>
  );
}

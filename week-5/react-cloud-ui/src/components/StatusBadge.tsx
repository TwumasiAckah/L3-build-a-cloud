import { cn } from "../lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    creating: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    ready: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    deleting: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    failed: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    unknown: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  const defaultStyle = "bg-gray-500/20 text-gray-300 border-gray-500/30";

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
          status === "ready"
            ? "bg-emerald-400 animate-pulse"
            : status === "creating"
              ? "bg-blue-400 animate-pulse"
              : status === "failed"
                ? "bg-rose-400"
                : "bg-gray-400",
        )}
      />
      {status}
    </span>
  );
}

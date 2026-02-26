import { useAuditLogs } from "../hooks/use-logs";
import { Layout } from "../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  ChevronDown,
  Search,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { AuditLog } from "../shared/schema";

export default function AuditLogs() {
  const { data: logs, isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredLogs = useMemo(() => {
    return (logs ?? [])
      .filter((log: AuditLog) => {
        const searchStr = search.toLowerCase();
        const resource = log.resource_name?.toLowerCase() ?? "";
        const user = log.user?.toLowerCase() ?? "";
        const action = log.action?.toLowerCase() ?? "";

        return (
          resource.includes(searchStr) ||
          user.includes(searchStr) ||
          action.includes(searchStr)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [logs, search, sortOrder]);

  const formatDetails = (details?: Record<string, unknown>) => {
    if (!details) return "-";

    // Extract useful info
    const parts = [];
    if (details.method) parts.push(details.method);
    if (details.path) parts.push(details.path);
    if (details.status_code || details.status)
      parts.push(`Status: ${details.status_code || details.status}`);
    if (details.duration_ms) parts.push(`${details.duration_ms}ms`);

    return parts.length > 0
      ? parts.join(" • ")
      : JSON.stringify(details, null, 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all administrative actions across your organization.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">
                  Activity History
                </CardTitle>
                <CardDescription>
                  Recent actions performed by users.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter logs..."
                  className="pl-9 bg-background border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-card/50">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead
                        className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                        onClick={() =>
                          setSortOrder((prev) =>
                            prev === "desc" ? "asc" : "desc",
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span>Timestamp</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              sortOrder === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        User
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Action
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Resource
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs && filteredLogs.length > 0 ? (
                      filteredLogs.map((log, idx) => (
                        <TableRow
                          key={`${log.timestamp}-${idx}`}
                          className="group border-border hover:bg-secondary/30"
                        >
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {log.details?.time || log.timestamp
                                ? format(
                                    new Date(log.timestamp),
                                    "MMM d, HH:mm:ss",
                                  )
                                : "-"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-sm text-foreground">
                                {log.user || "anonymous"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                log.action === "DELETE"
                                  ? "destructive"
                                  : log.action === "UPDATE"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-[10px]"
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground">
                            {log.resource_name || "-"}
                          </TableCell>

                          <TableCell>
                            {log.success ? (
                              <div className="flex items-center gap-1.5 text-emerald-500">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Success
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-500">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Failed
                                </span>
                              </div>
                            )}
                          </TableCell>

                          {/* <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {log.details
                              ? typeof log.details === "string"
                                ? log.details
                                : JSON.stringify(log.details)
                              : "-"}
                          </TableCell> */}

                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {formatDetails(log.details)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

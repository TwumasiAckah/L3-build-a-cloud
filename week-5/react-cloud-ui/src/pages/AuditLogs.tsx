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
import { Search, User, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function AuditLogs() {
  const { data: logs, isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = logs?.filter(
    (log) =>
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()),
  );

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
                      <TableHead className="text-muted-foreground">
                        Timestamp
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
                      filteredLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="group border-border hover:bg-secondary/30"
                        >
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {log.timestamp
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
                                {log.username}
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
                            {log.resource}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {log.details || "-"}
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

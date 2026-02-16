import { useDatabases, useDeleteDatabase } from "../hooks/use-databases";
import { Layout } from "../components/Layout";
import { CreateDatabaseDialog } from "../components/CreateDatabaseDialog";
import { StatusBadge } from "../components/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  MoreHorizontal,
  HardDrive,
  Cpu,
  ExternalLink,
  Trash2,
  Database,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { Skeleton } from "../components/ui/skeleton";

export default function Dashboard() {
  const { data: databases, isLoading, isError } = useDatabases();
  const deleteDb = useDeleteDatabase();
  const [dbToDelete, setDbToDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-100 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Failed to load databases</h2>
          <p className="text-muted-foreground mb-6">
            Something went wrong while communicating with the server.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  const activeCount =
    databases?.filter((d) => d.status === "ready").length || 0;
  const totalStorage = databases?.length || 0;
  const totalInstances =
    databases?.reduce((acc, curr) => acc + curr.instances, 0) || 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your database fleet
            </p>
          </div>
          <CreateDatabaseDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Databases
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">
                {databases?.length} total provisioned
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Databases
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStorage}</div>
              <p className="text-xs text-muted-foreground">
                {databases?.length} total provisioned
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Instances
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInstances}</div>
              <p className="text-xs text-muted-foreground">Replicas running</p>
            </CardContent>
          </Card>
        </div>

        {/* Databases Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Databases</CardTitle>
          </CardHeader>
          <CardContent>
            {databases && databases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Instances</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>PostgreSQL</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {databases.map((db) => (
                    <TableRow key={db.name}>
                      <TableCell className="font-medium">
                        <Link href={`/databases/${db.name}`}>
                          <span className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            {db.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={db.status} />
                      </TableCell>
                      <TableCell>
                        {db.ready_instances}/{db.instances}
                      </TableCell>
                      <TableCell>{db.storage_size}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {db.postgresql_version}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {db.created_at
                          ? new Date(db.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link href={`/databases/${db.name}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setDbToDelete(db.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Database
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No databases found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  You haven't created any databases yet. Provision your first
                  instance to get started.
                </p>
                <CreateDatabaseDialog />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!dbToDelete}
        onOpenChange={(open) => !open && setDbToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              database
              <span className="font-semibold text-foreground mx-1">
                {dbToDelete}
              </span>
              and remove all data associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (dbToDelete) deleteDb.mutate(dbToDelete);
                setDbToDelete(null);
              }}
            >
              Delete Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

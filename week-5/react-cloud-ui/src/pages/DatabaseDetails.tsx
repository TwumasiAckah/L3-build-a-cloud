import { useParams, Link } from "wouter";
import {
  useDatabase,
  useDatabaseCredentials,
  useUpdateDatabase,
} from "../hooks/use-databases";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ArrowLeft, Copy, Check, Settings, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "../lib/utils";

function CredentialsDialog({ name }: { name: string }) {
  const { data: creds, refetch, isFetching } = useDatabaseCredentials(name);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch when dialog opens (handled by parent opening logic ideally, but refetch works)
    refetch();
  }, [name, refetch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectionString = creds
    ? `postgres://${creds.username}:${creds.password}@${creds.host}:${creds.port}/${creds.database}`
    : "Loading...";

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Connection Credentials</DialogTitle>
        <DialogDescription>
          Use these details to connect to your database.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        {isFetching ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : creds ? (
          <>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-muted-foreground">Host</div>
              <div className="col-span-2 font-mono select-all">
                {creds.host}
              </div>

              <div className="text-muted-foreground">Port</div>
              <div className="col-span-2 font-mono">{creds.port}</div>

              <div className="text-muted-foreground">User</div>
              <div className="col-span-2 font-mono select-all">
                {creds.username}
              </div>

              <div className="text-muted-foreground">Database</div>
              <div className="col-span-2 font-mono select-all">
                {creds.database}
              </div>
            </div>

            <div className="relative mt-4">
              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto text-wrap break-all pr-10">
                {connectionString}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(connectionString)}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-destructive">Failed to load credentials.</div>
        )}
      </div>
    </DialogContent>
  );
}

function UpdateConfigDialog({
  name,
  currentInstances,
  currentStorageSize,
}: {
  name: string;
  currentInstances: number;
  currentStorageSize: string;
}) {
  const updateDb = useUpdateDatabase();
  const [instances, setInstances] = useState(currentInstances);
  const [storageSize, setStorageSize] = useState(currentStorageSize);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    await updateDb.mutateAsync({
      name,
      instances,
      storage_size: storageSize,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Update Config
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scale Resources</DialogTitle>
          <DialogDescription>
            Modify compute and storage allocation for {name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Instances</label>
              <span className="text-sm text-muted-foreground">{instances}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[instances]}
              onValueChange={(v) => setInstances(v[0])}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Storage Size</label>
              <span className="text-sm text-muted-foreground">
                {storageSize}
              </span>
            </div>
            <Input
              value={storageSize}
              onChange={(e) => setStorageSize(e.target.value)}
              placeholder="5Gi"
            />
            <p className="text-xs text-muted-foreground">
              e.g., 10Gi, 20Gi, 50Gi, 100Gi
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateDb.isPending}>
              {updateDb.isPending ? "Applying..." : "Apply Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DatabaseDetails() {
  const { name } = useParams<{ name: string }>();
  const { data: db, isLoading, isError } = useDatabase(name!);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !db) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Database not found</h2>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-enter">
        {/* Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{db.name}</h1>
                <StatusBadge status={db.status} />
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Created on{" "}
                {db.created_at
                  ? format(new Date(db.created_at), "MMMM d, yyyy")
                  : "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <UpdateConfigDialog
              name={db.name}
              currentInstances={db.instances}
              currentStorageSize={db.storage_size}
            />

            <Dialog>
              <DialogTrigger asChild>
                <Button className="cursor-pointer">
                  <Key className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </DialogTrigger>
              <CredentialsDialog name={db.name} />
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                      Storage
                    </div>
                    <div className="text-3xl font-bold flex items-baseline gap-1">
                      {db.storage_size}
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[0%]" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      0% used per instance
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                      Availability
                    </div>
                    <div className="text-3xl font-bold flex items-baseline gap-1">
                      {db.instances}
                      <span className="text-sm text-muted-foreground font-normal">
                        Nodes
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-2 flex-1 rounded-full",
                            i < db.instances
                              ? "bg-emerald-500"
                              : "bg-secondary",
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {db.instances > 1 ? "Replication active" : "Single node"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={db.status} />
                </div>
                {/* <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Region</span>
                  <span className="text-sm font-medium">{db.region}</span>
                </div> */}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    PostgreSQL Version
                  </span>
                  <span className="text-sm font-medium">
                    {db.postgresql_version}
                  </span>
                </div>
                {/* <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Maintenance Window
                  </span>
                  <span className="text-sm font-medium">Sun 02:00 UTC</span>
                </div> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

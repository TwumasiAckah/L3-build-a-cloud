import { useState, useEffect} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useDatabase,
  useDatabaseCredentials,
  useUpdateDatabase,
} from "../hooks/use-databases";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";

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
import {
  ArrowLeft,
  Copy,
  Check,
  Key,
  Settings,
} from "lucide-react";

function CredentialsDialog({ name }: { name: string }) {
  const { data: creds, refetch, isFetching } = useDatabaseCredentials(name);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
              <div className="col-span-2 font-mono select-all">{creds.host}</div>

              <div className="text-muted-foreground">Port</div>
              <div className="col-span-2 font-mono">{creds.port}</div>

              <div className="text-muted-foreground">User</div>
              <div className="col-span-2 font-mono select-all">{creds.username}</div>

              <div className="text-muted-foreground">Database</div>
              <div className="col-span-2 font-mono select-all">{creds.database}</div>
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
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
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
  currentStorageSize: number;
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
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Update Config
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scale Resources</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Instances</label>
              <span className="text-sm text-muted-foreground">{instances}</span>
            </div>
            <Slider min={1} max={5} step={1} value={[instances]} onValueChange={(v: number[]) => setInstances(v[0])} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Storage Size</label>
              <span className="text-sm text-muted-foreground">{storageSize}</span>
            </div>
            <Input value={storageSize} onChange={(e) => setStorageSize(parseInt(e.target.value) || 0)} placeholder="10Gi" />
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
  const navigate = useNavigate();
  const { data: db, isLoading, isError } = useDatabase(name!);

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (isError || !db) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Database not found</h2>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-enter">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{db.name}</h1>
          <StatusBadge status={db.status} />
        </div>

        <div className="flex gap-2 mt-4">
          <UpdateConfigDialog
            name={db.name}
            currentInstances={db.instances}
            currentStorageSize={db.storage_size}
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Key className="w-4 h-4 mr-2" />
                Connect
              </Button>
            </DialogTrigger>
            <CredentialsDialog name={db.name} />
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}

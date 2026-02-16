import { useState } from "react";
import { useCreateDatabase } from "../hooks/use-databases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Plus } from "lucide-react";
import { createDatabaseSchema } from "../shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

const formSchema = createDatabaseSchema;

type FormValues = z.infer<typeof formSchema>;

export function CreateDatabaseDialog() {
  const [open, setOpen] = useState(false);
  const createDb = useCreateDatabase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      instances: 1,
      storage_size: "10Gi",
      postgresql_version: 16,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createDb.mutateAsync(values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create database:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          New Database
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Create Database</DialogTitle>
          <DialogDescription>
            Provision a new PostgreSQL instance. You can scale it later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Name</FormLabel>
                  <FormControl>
                    <Input placeholder="production-db-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instances"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instances: {field.value}</FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground pt-1">
                    High availability replicas
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storage_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Size</FormLabel>
                  <FormControl>
                    <Input placeholder="10Gi" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground pt-1">
                    e.g., 10Gi, 20Gi, 50Gi
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postgresql_version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PostgreSQL Version: {field.value}</FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <Slider
                        min={12}
                        max={17}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDb.isPending}>
                {createDb.isPending ? "Provisioning..." : "Create Database"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
      storage_size: 10,
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
        <Button className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          New Database
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              name="storage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage: {field.value} GB</FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <Slider
                        min={5}
                        max={100}
                        step={5}
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

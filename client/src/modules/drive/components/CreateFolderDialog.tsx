import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/error/api.error";
import { createFolderSchema } from "../validation";
import type { CreateFolderFormValues } from "../validation";
import { useCreateDirectoryMutation } from "../queries";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentDirId: string;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentDirId,
}: CreateFolderDialogProps) {
  const createDirectory = useCreateDirectoryMutation();
  const form = useForm<CreateFolderFormValues>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CreateFolderFormValues) {
    try {
      await createDirectory.mutateAsync({
        name: values.name,
        parentDirId,
      });
      toast.success("Folder created");
      form.reset({ name: "" });
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({ name: "" });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Field>
            <FieldLabel htmlFor="folder-name-input">Name</FieldLabel>
            <Input
              id="folder-name-input"
              autoFocus
              placeholder="Untitled folder"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDirectory.isPending}>
              {createDirectory.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {createDirectory.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

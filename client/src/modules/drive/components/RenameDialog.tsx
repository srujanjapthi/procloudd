import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { renameSchema } from "../validation";
import type { RenameFormValues } from "../validation";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseName: string;
  extension?: string;
  onConfirm: (name: string) => void;
  isPending: boolean;
}

export function RenameDialog({
  open,
  onOpenChange,
  baseName,
  extension,
  onConfirm,
  isPending,
}: RenameDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: baseName },
  });
  const { ref: registerRef, ...nameField } = form.register("name");

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset({ name: baseName });
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, baseName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => onConfirm(values.name))}
          noValidate
        >
          <Field>
            <FieldLabel htmlFor="rename-input">Name</FieldLabel>
            <div className="flex items-center gap-1.5">
              <Input
                id="rename-input"
                className="flex-1"
                aria-invalid={!!form.formState.errors.name}
                {...nameField}
                ref={(el) => {
                  registerRef(el);
                  inputRef.current = el;
                }}
              />
              {extension && (
                <span className="text-muted-foreground shrink-0 text-sm">
                  .{extension}
                </span>
              )}
            </div>
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

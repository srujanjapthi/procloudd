import { Controller } from "react-hook-form";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field";
import { useUpdateProfileForm } from "@/modules/auth/hooks/useUpdateProfileForm";
import type { CurrentUser } from "@/modules/auth/types";

interface UpdateProfileFormProps {
  user: CurrentUser;
  fields: { label: string; value: string }[];
}

export function UpdateProfileForm({ user, fields }: UpdateProfileFormProps) {
  const {
    form,
    isEditing,
    hasChanges,
    startEditing,
    cancelEditing,
    trimField,
    submitUpdateProfile,
  } = useUpdateProfileForm(user);

  const fullName = [
    user.name.firstName,
    user.name.middleName,
    user.name.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const nameError =
    form.formState.errors.name?.firstName ??
    form.formState.errors.name?.middleName ??
    form.formState.errors.name?.lastName;

  return (
    <form onSubmit={form.handleSubmit(submitUpdateProfile)} noValidate>
      <div className="flex items-center justify-between pb-1">
        <span className="text-muted-foreground text-xs font-medium">
          Basic info
        </span>
        {!isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            onClick={startEditing}
            aria-label="Edit name and username"
          >
            <Pencil />
          </Button>
        )}
      </div>

      <dl className="divide-border divide-y text-sm">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground shrink-0">Name</dt>
          <dd className="font-medium">
            {isEditing ? (
              <div className="flex gap-1.5">
                <Controller
                  name="name.firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        trimField("name.firstName");
                      }}
                      className="w-20"
                      placeholder="First"
                      aria-label="First name"
                      aria-invalid={fieldState.invalid}
                    />
                  )}
                />
                <Controller
                  name="name.middleName"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        trimField("name.middleName");
                      }}
                      className="w-20"
                      placeholder="Middle"
                      aria-label="Middle name"
                    />
                  )}
                />
                <Controller
                  name="name.lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        trimField("name.lastName");
                      }}
                      className="w-20"
                      placeholder="Last"
                      aria-label="Last name"
                      aria-invalid={fieldState.invalid}
                    />
                  )}
                />
              </div>
            ) : (
              fullName
            )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground shrink-0">Username</dt>
          <dd className="font-medium">
            {isEditing ? (
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      trimField("username");
                    }}
                    className="w-40"
                    aria-label="Username"
                    aria-invalid={fieldState.invalid}
                  />
                )}
              />
            ) : (
              user.username
            )}
          </dd>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3 py-2.5">
            <FieldError errors={[nameError, form.formState.errors.username]} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEditing}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={
                form.formState.isSubmitting ||
                !hasChanges ||
                !form.formState.isValid
              }
            >
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        )}

        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between py-2.5"
          >
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="font-medium">{field.value}</dd>
          </div>
        ))}

        <div className="flex items-center justify-between py-2.5">
          <dt className="text-muted-foreground">Role</dt>
          <dd>
            <Badge variant="secondary">{user.role}</Badge>
          </dd>
        </div>
      </dl>
    </form>
  );
}

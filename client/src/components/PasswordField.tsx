import { Controller } from "react-hook-form";
import type { Control, FieldPathByValue, FieldValues } from "react-hook-form";
import { PasswordInput } from "@/components/PasswordInput";
import { RequiredMark } from "@/components/RequiredMark";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface PasswordFieldProps<TFieldValues extends FieldValues> {
  name: FieldPathByValue<TFieldValues, string>;
  control: Control<TFieldValues>;
  label: string;
  required?: boolean;
  autoComplete?: string;
}

export function PasswordField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  required,
  autoComplete,
}: PasswordFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>
            {label} {required && <RequiredMark />}
          </FieldLabel>
          <PasswordInput
            {...field}
            id={name}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

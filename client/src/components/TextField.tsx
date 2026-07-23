import { Controller } from "react-hook-form";
import type { Control, FieldPathByValue, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/RequiredMark";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface TextFieldProps<TFieldValues extends FieldValues> {
  name: FieldPathByValue<TFieldValues, string | undefined>;
  control: Control<TFieldValues>;
  label: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}

export function TextField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  required,
  type = "text",
  autoComplete,
}: TextFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>
            {label} {required && <RequiredMark />}
          </FieldLabel>
          <Input
            {...field}
            id={name}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

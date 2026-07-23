import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { updateProfileSchema } from "../validation";
import type { UpdateProfileFormValues } from "../validation";
import {
  useUpdateProfileMutation,
  useCheckAvailabilityMutation,
} from "../queries";
import type { CurrentUser } from "../types";
import { getApiErrorMessage } from "@/error/api.error";

function toFormValues(user: CurrentUser): UpdateProfileFormValues {
  return {
    username: user.username,
    name: {
      firstName: user.name.firstName,
      middleName: user.name.middleName ?? "",
      lastName: user.name.lastName,
    },
  };
}

function deepTrim<T>(value: T): T {
  if (typeof value === "string") {
    return value.trim() as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepTrim(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, deepTrim(val)])
    ) as T;
  }
  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  );
}

export function useUpdateProfileForm(user: CurrentUser) {
  const [isEditing, setIsEditing] = useState(false);
  const updateProfileMutation = useUpdateProfileMutation();
  const checkAvailabilityMutation = useCheckAvailabilityMutation();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: toFormValues(user),
    mode: "onChange",
  });

  const watchedValues = useWatch({ control: form.control });
  const hasChanges = !deepEqual(
    deepTrim(watchedValues),
    deepTrim(toFormValues(user))
  );

  useEffect(() => {
    form.reset(toFormValues(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.username,
    user.name.firstName,
    user.name.middleName,
    user.name.lastName,
  ]);

  function startEditing() {
    setIsEditing(true);
  }

  function trimField(name: FieldPath<UpdateProfileFormValues>) {
    const value = form.getValues(name);
    if (typeof value === "string") {
      form.setValue(name, value.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function cancelEditing() {
    form.reset(toFormValues(user));
    setIsEditing(false);
  }

  async function submitUpdateProfile(values: UpdateProfileFormValues) {
    try {
      if (values.username !== user.username) {
        const availability = await checkAvailabilityMutation.mutateAsync({
          username: values.username,
        });
        if (availability.username === false) {
          form.setError("username", { message: "Username already taken" });
          return;
        }
      }

      await updateProfileMutation.mutateAsync({
        username: values.username,
        name: {
          ...values.name,
          middleName: values.name.middleName || null,
        },
      });
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return {
    form,
    isEditing,
    hasChanges,
    startEditing,
    cancelEditing,
    trimField,
    submitUpdateProfile,
  };
}

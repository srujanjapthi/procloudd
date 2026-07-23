import type { ReactNode } from "react";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogContentProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export function ConfirmDialogContent({
  title,
  description,
  confirmLabel,
  onConfirm,
  isConfirming,
}: ConfirmDialogContentProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

import { Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTotpLoginScreen } from "../hooks/useTotpLoginScreen";
import APP_CONFIG from "@/constants/config";

const CODE_LENGTH = APP_CONFIG.totp.codeLength;

interface TotpLoginScreenProps {
  onVerified: (code: string) => Promise<void>;
  onBack: () => void;
}

export function TotpLoginScreen({ onVerified, onBack }: TotpLoginScreenProps) {
  const { mode, toggleMode, code, setCode, isSubmitting, submit, canSubmit } =
    useTotpLoginScreen(onVerified);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <p className="text-muted-foreground text-sm">
        {mode === "totp"
          ? "Enter the code from your authenticator app"
          : "Enter one of your recovery codes"}
      </p>

      {mode === "totp" ? (
        <div className="flex justify-center">
          <InputOTP
            maxLength={CODE_LENGTH}
            value={code}
            onChange={setCode}
            onComplete={submit}
            disabled={isSubmitting}
          >
            <InputOTPGroup>
              {Array.from({ length: CODE_LENGTH }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-11 text-base"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      ) : (
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="XXXXX-XXXXX"
          autoComplete="one-time-code"
          className="text-center font-mono tracking-wider"
          disabled={isSubmitting}
        />
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Verifying…" : "Sign in"}
      </Button>

      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={toggleMode}
        className="h-auto w-full p-0 text-xs"
      >
        {mode === "totp"
          ? "Use a recovery code instead"
          : "Use your authenticator app instead"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="w-full"
      >
        Back
      </Button>
    </form>
  );
}

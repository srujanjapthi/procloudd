import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PasswordField } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { useTwoFactorSettings } from "@/modules/auth/hooks/useTwoFactorSettings";
import type {
  DisableTwoFactorFormValues,
  RegenerateRecoveryCodesFormValues,
} from "@/modules/auth/validation";
import type { CurrentUser } from "@/modules/auth/types";
import APP_CONFIG from "@/constants/config";

const CODE_LENGTH = APP_CONFIG.totp.codeLength;

interface TwoFactorSettingsProps {
  user: CurrentUser;
}

export function TwoFactorSettings({ user }: TwoFactorSettingsProps) {
  const {
    view,
    isEnabled,
    setupData,
    setupCode,
    setSetupCode,
    isSettingUp,
    isConfirmingSetup,
    startSetup,
    cancelSetup,
    confirmSetup,
    copiedSecret,
    copySecret,
    recoveryCodes,
    finishRecoveryCodes,
    copiedRecoveryCodes,
    copyRecoveryCodes,
    disableForm,
    startDisable,
    cancelDisable,
    submitDisable,
    isDisabling,
    regenerateForm,
    startRegenerate,
    cancelRegenerate,
    submitRegenerate,
    isRegenerating,
  } = useTwoFactorSettings(user);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-medium">Two-factor authentication</h4>
          <p className="text-muted-foreground text-xs">
            {isEnabled
              ? "Your account is protected with an authenticator app."
              : "Add an extra layer of security using an authenticator app."}
          </p>
        </div>
        {view === "idle" && !isEnabled && (
          <Button size="sm" onClick={startSetup} disabled={isSettingUp}>
            {isSettingUp && <Loader2 className="size-4 animate-spin" />}
            Enable
          </Button>
        )}
      </div>

      {view === "idle" && isEnabled && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Enabled</Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startRegenerate}
          >
            Regenerate recovery codes
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={startDisable}
          >
            Disable
          </Button>
        </div>
      )}

      {view === "setup" && setupData && (
        <div className="bg-muted/40 space-y-4 rounded-lg border p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <img
              src={setupData.qrCodeDataUrl}
              alt="Two-factor setup QR code"
              className="size-36 shrink-0 rounded-md border bg-white p-1.5"
            />
            <div className="w-full min-w-0 flex-1 space-y-2">
              <p className="text-muted-foreground text-xs">
                Scan this with an authenticator app (Google Authenticator,
                Authy, 1Password, etc.), or enter the code manually:
              </p>
              <div className="bg-background flex items-center justify-between gap-2 rounded border px-2 py-1">
                <code className="min-w-0 flex-1 truncate text-xs">
                  {setupData.secret}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground shrink-0"
                  onClick={copySecret}
                  aria-label="Copy secret"
                >
                  {copiedSecret ? <Check /> : <Copy />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-xs">
              Enter the 6-digit code from your app to confirm
            </p>
            <InputOTP
              maxLength={CODE_LENGTH}
              value={setupCode}
              onChange={setSetupCode}
              disabled={isConfirmingSetup}
            >
              <InputOTPGroup>
                {Array.from({ length: CODE_LENGTH }, (_, index) => (
                  <InputOTPSlot key={index} index={index} className="size-10" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelSetup}
                disabled={isConfirmingSetup}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={confirmSetup}
                disabled={setupCode.length !== CODE_LENGTH || isConfirmingSetup}
              >
                {isConfirmingSetup && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Confirm & enable
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === "recovery-codes" && (
        <div className="bg-muted/40 space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Save your recovery codes</p>
          <p className="text-muted-foreground text-xs">
            Each code can be used once to sign in if you lose access to your
            authenticator app. Store them somewhere safe — you won&apos;t see
            them again.
          </p>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
            {recoveryCodes.map((code) => (
              <div
                key={code}
                className="bg-background rounded border px-2 py-1 text-center"
              >
                {code}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyRecoveryCodes}
            >
              {copiedRecoveryCodes ? <Check /> : <Copy />}
              {copiedRecoveryCodes ? "Copied" : "Copy codes"}
            </Button>
            <Button type="button" size="sm" onClick={finishRecoveryCodes}>
              Done
            </Button>
          </div>
        </div>
      )}

      {view === "disable" && (
        <form
          onSubmit={disableForm.handleSubmit(submitDisable)}
          className="bg-muted/40 space-y-3 rounded-lg border p-4"
        >
          <PasswordField<DisableTwoFactorFormValues>
            name="password"
            control={disableForm.control}
            label="Password"
            autoComplete="current-password"
            required
          />
          <TextField<DisableTwoFactorFormValues>
            name="code"
            control={disableForm.control}
            label="Authenticator or recovery code"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelDisable}
              disabled={isDisabling}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isDisabling}
            >
              {isDisabling && <Loader2 className="size-4 animate-spin" />}
              Disable
            </Button>
          </div>
        </form>
      )}

      {view === "regenerate" && (
        <form
          onSubmit={regenerateForm.handleSubmit(submitRegenerate)}
          className="bg-muted/40 space-y-3 rounded-lg border p-4"
        >
          <PasswordField<RegenerateRecoveryCodesFormValues>
            name="password"
            control={regenerateForm.control}
            label="Password"
            autoComplete="current-password"
            required
          />
          <TextField<RegenerateRecoveryCodesFormValues>
            name="code"
            control={regenerateForm.control}
            label="Authenticator or recovery code"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelRegenerate}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isRegenerating}>
              {isRegenerating && <Loader2 className="size-4 animate-spin" />}
              Regenerate
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

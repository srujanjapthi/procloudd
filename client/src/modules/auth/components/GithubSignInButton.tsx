import GithubIcon from "@/assets/github-icon.svg?react";
import { Button } from "@/components/ui/button";
import { useGithubSignIn } from "../hooks/useGithubSignIn";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";

export function GithubSignInButton() {
  const { handleClick, isProcessing } = useGithubSignIn();

  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-[320px]"
        onClick={handleClick}
      >
        <GithubIcon className="size-4" aria-hidden="true" />
        Continue with GitHub
      </Button>
      <ProcessingOverlay show={isProcessing} />
    </div>
  );
}

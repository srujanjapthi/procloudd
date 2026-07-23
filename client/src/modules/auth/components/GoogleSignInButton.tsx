import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import APP_CONFIG from "@/constants/config";

export function GoogleSignInButton() {
  const { handleCredential } = useGoogleSignIn();
  const { resolvedTheme } = useTheme();
  const [oneTapEnabled, setOneTapEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setOneTapEnabled(true),
      APP_CONFIG.ui.googleOneTapDelayMs
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(response) => handleCredential(response.credential)}
        onError={() => toast.error("Google sign-in failed")}
        theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
        size="large"
        text="continue_with"
        width={320}
        useOneTap={oneTapEnabled}
      />
    </div>
  );
}

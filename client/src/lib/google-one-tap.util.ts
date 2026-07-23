declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          cancel?: () => void;
        };
      };
    };
  }
}

export function cancelGoogleOneTap(): void {
  window.google?.accounts?.id?.cancel?.();
}

import { QueryClient } from "@tanstack/react-query";
import APP_CONFIG from "@/constants/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: APP_CONFIG.query.retry,
      staleTime: APP_CONFIG.query.staleTimeMs,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;

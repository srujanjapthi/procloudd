import axios from "axios";
import ApiError from "@/error/api.error";
import type { ApiErrorResponse } from "@/types/api";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const body = error.response.data as ApiErrorResponse;
      return Promise.reject(
        new ApiError(
          body.message,
          body.code,
          error.response.status,
          body.errors
        )
      );
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(
          "Network error. Please check your connection.",
          "INTERNAL_ERROR",
          0
        )
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;

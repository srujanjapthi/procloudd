import { LoadingScreen } from "@/components/LoadingScreen";
import { useGithubCallbackPage } from "../hooks/useGithubCallbackPage";

export default function GithubCallbackPage() {
  useGithubCallbackPage();
  return <LoadingScreen />;
}

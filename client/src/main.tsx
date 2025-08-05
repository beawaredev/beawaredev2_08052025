import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import "@/lib/request-interceptor"; // Initialize request interceptor early

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);

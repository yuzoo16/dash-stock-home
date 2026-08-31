import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/")({
  component: AppIndex,
});

function AppIndex() {
  return <Navigate to="/app/dashboard" />;
}

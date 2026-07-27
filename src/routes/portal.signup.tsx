import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/portal/signup")({
  component: RedirectToActivateAccount,
});

function RedirectToActivateAccount() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/portal/activate-account", replace: true });
  }, [navigate]);

  return null;
}

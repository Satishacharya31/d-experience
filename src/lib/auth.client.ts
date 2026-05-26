import { createMiddleware } from "@tanstack/react-start";

// This client-side middleware automatically attaches the JWT admin token from localStorage to outgoing server function requests (RPCs)
export const attachAdminAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
);

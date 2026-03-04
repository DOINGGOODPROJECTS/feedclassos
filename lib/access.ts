import { Role } from "./types";

export function hasRouteAccess(role: Role, pathname: string) {
  if (pathname.startsWith("/app/admin")) {
    return role === "ADMIN";
  }
  if (pathname.startsWith("/app/supervisor")) {
    return role === "SUPERVISOR";
  }
  if (pathname.startsWith("/app/donor")) {
    return role === "DONOR_READONLY";
  }
  return true;
}

"use client";

import Swal from "sweetalert2";
import { ApiRequestError } from "@/lib/api";

export const showError = (title: string) =>
  Swal.fire({ toast: true, position: "top-end", icon: "error", title, showConfirmButton: false, timer: 5000 });

/** Backend validation errors carry the field list in the message; fall back to a generic line */
export const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiRequestError || err instanceof Error ? err.message || fallback : fallback;

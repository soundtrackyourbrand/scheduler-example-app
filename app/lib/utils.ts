import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pageTitle(...pages: string[]): string {
  return `${pages.join(" / ")} - Scheduler`;
}

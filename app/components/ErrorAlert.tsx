import React from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export default function ErrorAlert(props: {
  error: unknown;
  className?: string;
}) {
  const { error, className } = props;
  if (error === undefined || error === null) return null;

  const err = typeof error === "string" ? error : error.toString();
  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{err}</AlertDescription>
    </Alert>
  );
}

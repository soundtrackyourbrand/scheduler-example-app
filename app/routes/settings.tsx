import React from "react";
import useSWR from "swr";
import Page from "~/components/Page";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { accountsFetcher } from "~/fetchers";
import { useMusicLibrary } from "~/lib/MusicLibraryContext";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";
import AssignableSelect from "~/components/AssignableSelect";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Settings") }];
};

export default function Settings() {
  const { data: accounts } = useSWR("/api/v1/accounts", accountsFetcher);
  const { libraryId, setLibraryId } = useMusicLibrary();
  const selectedAccount = libraryId
    ? accounts?.find((account) => account.id === libraryId)
    : null;

  let musicLibraryButtonLabel = "Select music library";
  let musicLibraryErrorMessage: string | null = null;

  if (selectedAccount) {
    musicLibraryButtonLabel = selectedAccount.businessName;
  } else if (libraryId && accounts) {
    musicLibraryErrorMessage = `The account with id "${libraryId}" is selected but it is not available with your API key.`;
  }

  return (
    <Page breadcrumbs={[{ label: "Settings" }]}>
      <h1>Music library</h1>
      <p className="text-sm text-slate-400">
        Set which music library to use when selecting music
      </p>
      {musicLibraryErrorMessage && (
        <Alert variant="destructive" className="mt-4">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <AlertTitle>Music library error</AlertTitle>
          <AlertDescription>{musicLibraryErrorMessage}</AlertDescription>
        </Alert>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="mt-4">
            {musicLibraryButtonLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {accounts?.map((account) => {
            return (
              <DropdownMenuCheckboxItem
                key={account.id}
                checked={libraryId !== null && libraryId === account.id}
                onCheckedChange={(checked) => {
                  if (!checked) return;
                  setLibraryId(account.id);
                  toast("Library updated");
                }}
              >
                {account.businessName}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <h3 className="mt-3 mb-2 text-sm">Preview selected library</h3>
      <AssignableSelect value={null} onChange={() => {}} />
    </Page>
  );
}

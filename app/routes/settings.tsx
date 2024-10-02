import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import Page from "~/components/Page";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { accountsFetcher, cacheFetcher } from "~/fetchers";
import { useMusicLibrary } from "~/lib/MusicLibraryContext";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";
import AssignableSelect from "~/components/AssignableSelect";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Settings") }];
};

export default function Settings() {
  const { data: accounts } = useSWR("/api/v1/accounts", accountsFetcher);
  const { data: cache } = useSWR("/api/v1/cache", cacheFetcher);
  const [loading, setLoading] = useState<string[]>([]);
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

  const addLoading = (item: string) => {
    setLoading((loading) =>
      loading.includes(item) ? loading : loading.concat([item]),
    );
  };

  const removeLoading = (item: string) => {
    setLoading((loading) => loading.filter((l) => l !== item));
  };

  const handleRefreshAccounts = () => {
    addLoading("accounts");
    const key = "/api/v1/accounts";
    fetch(key + "?skipCache=true")
      .then(() => {
        mutate(key);
        toast("Account cache refreshed");
      })
      .finally(() => removeLoading("accounts"));
  };

  const handleRefreshZones = () => {
    addLoading("zones");
    const key = "/api/v1/zones";
    fetch(key + "?skipCache=true")
      .then(() => {
        mutate(key);
        toast("Zone cache refreshed");
      })
      .finally(() => removeLoading("zones"));
  };

  const handleRefreshLibrary = () => {
    addLoading("library");
    const key = `/api/v1/accounts/${libraryId}/library`;
    fetch(key + "?skipCache=true")
      .then(() => {
        mutate(key);
        toast("Library cache refreshed");
      })
      .finally(() => removeLoading("library"));
  };

  const handleClear = () => {
    addLoading("clear");
    const key = "/api/v1/cache";
    fetch(key, { method: "DELETE" })
      .then(() => {
        mutate(key);
        toast("Cache cleared");
      })
      .finally(() => removeLoading("clear"));
  };

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
      <div className="border-t border-slate-200 my-4"></div>
      <h1>Cache</h1>
      <p className="text-sm text-slate-400">Manage the app cache</p>
      <div className="flex my-3 space-x-1">
        <Button
          onClick={handleRefreshAccounts}
          disabled={loading.includes("accounts")}
        >
          {loading.includes("accounts") && (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          Refresh accounts
        </Button>
        <Button
          onClick={handleRefreshZones}
          disabled={loading.includes("zones")}
        >
          {loading.includes("zones") && (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          Refresh zones
        </Button>
        <Button
          onClick={handleRefreshLibrary}
          disabled={loading.includes("library") || libraryId === null}
        >
          {loading.includes("library") && (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          Refresh selected library
        </Button>
      </div>
      <div className="flex my-3 space-x-1">
        <Button
          onClick={handleClear}
          disabled={loading.includes("clear")}
          variant="destructive"
        >
          Clear cache
        </Button>
      </div>
      <p>{cache?.count ?? "No"} items currently cached</p>
    </Page>
  );
}

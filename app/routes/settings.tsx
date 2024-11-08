import React, { useCallback, useState } from "react";
import useSWR, { mutate } from "swr";
import pluralize from "pluralize";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { MetaFunction } from "@remix-run/node";
import Page from "~/components/Page";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { accountsFetcher, authModeFetcher, cacheFetcher } from "~/fetchers";
import { useMusicLibrary } from "~/lib/MusicLibraryContext";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { cn, pageTitle } from "~/lib/utils";
import AssignableSelect from "~/components/AssignableSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useSWRMutation from "swr/mutation";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Settings") }];
};

export default function Settings() {
  const { data: accounts } = useSWR("/api/v1/accounts", accountsFetcher);
  const { data: cache } = useSWR("/api/v1/cache", cacheFetcher);
  const { data: authMode } = useSWR("/api/v1/auth/mode", authModeFetcher);
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="mt-4">
            {musicLibraryButtonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Select account" />
            <CommandEmpty>No accounts</CommandEmpty>
            <CommandList>
              {accounts?.map((account) => {
                return (
                  <CommandItem
                    key={account.id}
                    value={account.businessName}
                    onSelect={() => {
                      setLibraryId(account.id);
                      toast("Library updated");
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span>{account.businessName}</span>
                      <CheckIcon
                        className={cn(
                          "shrink-0",
                          account.id === libraryId
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
      <div>
        <p>{pluralize("item", cache?.count, true)} cached</p>
        <Button
          variant="outline"
          size="sm"
          disabled={loading.includes("cacheCount")}
          onClick={() => {
            addLoading("cacheCount");
            mutate("/api/v1/cache")
              .then(() => toast("Cache count refreshed"))
              .finally(() => removeLoading("cacheCount"));
          }}
        >
          <ReloadIcon className="mr-2" />
          Refresh count
        </Button>
      </div>
      <div className="border-t border-slate-200 my-4"></div>
      <h1>Authentication</h1>
      <p className="text-sm text-slate-400 mb-3">
        This app is using {authMode?.mode} authentication.
      </p>
      <div className="max-w-screen-sm">
        {authMode?.mode === "token" && (
          <p>
            With token authentication this app is using a Soundtrack API token
            to make requests to the Soundtrack API.
          </p>
        )}
        {authMode?.mode === "user" && (
          <>
            <LoggedInAlert loggedIn={authMode.loggedIn} className="my-4" />
            {!authMode.loggedIn && <UserLogin />}
            {authMode.loggedIn && <UserLogout />}
          </>
        )}
      </div>
    </Page>
  );
}

function LoggedInAlert({
  loggedIn,
  className,
}: {
  loggedIn: boolean;
  className?: string;
}) {
  return (
    <Alert className={className} variant={loggedIn ? "default" : "destructive"}>
      <AlertTitle>
        {loggedIn ? "Logged in, all set!" : "Not logged in"}
      </AlertTitle>
      {!loggedIn && (
        <AlertDescription>
          Until you are logged in you will not be able to access the Soundtrack
          API.
        </AlertDescription>
      )}
    </Alert>
  );
}

type LoginData = {
  email: string;
  password: string;
};

async function userLogin(
  url: string,
  { arg }: { arg: LoginData },
): Promise<void> {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Login failed");
    }
  });
}

function UserLogin() {
  const { trigger } = useSWRMutation("/api/v1/auth/login", userLogin);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<LoginData>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (data: LoginData) => {
    if (loading) return;
    setError(null);
    try {
      await trigger(data);
      mutate("/api/v1/auth/mode");
      toast("Logged in");
    } catch (e) {
      console.error(e);
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <h1>Log in</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(data);
        }}
        className="max-w-80"
      >
        <Label htmlFor="email-input">Email</Label>
        <Input
          id="email-input"
          value={data.email}
          onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
        />
        <Label htmlFor="password-input">Password</Label>
        <Input
          id="password-input"
          type="password"
          value={data.password}
          onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
        />
        <div className="mt-4">
          <Button type="submit" disabled={loading}>
            Log in
          </Button>
        </div>
      </form>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Login failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

async function userLogout(url: string): Promise<void> {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Logout failed");
    }
  });
}

function UserLogout() {
  const { trigger } = useSWRMutation("/api/v1/auth/logout", userLogout);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    setError(null);
    try {
      await trigger();
      mutate("/api/v1/auth/mode");
      toast("Logged out");
    } catch (e) {
      console.error(e);
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Button onClick={handleLogout} disabled={loading}>
        Log out
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Login failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

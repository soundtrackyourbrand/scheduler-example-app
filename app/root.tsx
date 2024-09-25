import React from "react";
import { Links, Meta, Outlet, Scripts } from "@remix-run/react";
import "./index.css";
import { MusicLibraryProvider } from "./lib/MusicLibraryContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <html>
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <MusicLibraryProvider>
          <Outlet />
          <Toaster />
        </MusicLibraryProvider>
        <Scripts />
      </body>
    </html>
  );
}

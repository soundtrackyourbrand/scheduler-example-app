import React from "react";
import { useNavigate } from "@remix-run/react";
import useSWRMutation from "swr/mutation";
import { Event } from "../types";
import EventForm, { EventData } from "~/components/forms/EventForm";
import Paper from "~/components/Paper";
import Page from "~/components/Page";
import { toast } from "sonner";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Events", "New") }];
};

async function createEvent(
  url: string,
  { arg }: { arg: EventData },
): Promise<Event> {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  }).then((res) => res.json());
}

export default function NewEvent() {
  const { trigger } = useSWRMutation("/api/v1/events", createEvent);
  const navigate = useNavigate();

  const handleSubmit = async (data: EventData) => {
    const response = await trigger(data);
    toast("Created event #" + response.id + ": " + response.name);
    navigate("/events/" + response.id);
  };

  return (
    <Page breadcrumbs={[{ label: "Events", to: "/events" }, { label: "New" }]}>
      <Paper>
        <EventForm onSubmit={handleSubmit} action="Create event" />
      </Paper>
    </Page>
  );
}

import React from "react";
import { useNavigate } from "@remix-run/react";
import useSWRMutation from "swr/mutation";
import { Rule } from "../types";
import RuleCreate, { RuleData } from "~/components/forms/RuleCreate";
import Paper from "~/components/Paper";
import Page from "~/components/Page";
import { toast } from "sonner";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Events", "New") }];
};

async function createRule(
  url: string,
  { arg }: { arg: RuleData },
): Promise<Rule> {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  }).then((res) => res.json());
}

export default function NewRule() {
  const { trigger } = useSWRMutation("/api/v1/rules", createRule);
  const navigate = useNavigate();

  const handleSubmit = async (data: RuleData) => {
    const response = await trigger(data);
    toast("Created event #" + response.id + ": " + response.name);
    navigate("/rules/" + response.id);
  };

  return (
    <Page breadcrumbs={[{ label: "Events", to: "/rules" }, { label: "New" }]}>
      <Paper>
        <RuleCreate onSubmit={handleSubmit} action="Create event" />
      </Paper>
    </Page>
  );
}

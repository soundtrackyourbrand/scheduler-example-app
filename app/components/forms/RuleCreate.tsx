import React from "react";
import { useState } from "react";
import DatePicker from "~/components/DatePicker";
import { RepeatPart, Rule } from "~/types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import AssignableSelect from "../AssignableSelect";
import ErrorAlert from "../ErrorAlert";
import { Checkbox } from "../ui/checkbox";
import RepeatPartSelect from "../RepeatPartSelect";
import FormControl from "./FormControl";
import { ExternalLink, soundtrackUrl } from "../ExternalLinks";

export type RuleData = {
  name: string;
  description: string;
  at: Date | undefined;
  assign: string | null;
  repeat: number | null;
  repeatPart: RepeatPart | null;
};

type RuleCreateProps = {
  initialRule?: Rule;
  initialData?: RuleData;
  onSubmit: (data: RuleData) => Promise<unknown>;
  onCancel?: () => void;
  error?: unknown;
  action: string;
};

const defaultRuleData: RuleData = {
  name: "",
  description: "",
  at: new Date(),
  assign: "",
  repeat: null,
  repeatPart: null,
};

function getInitialRuleData(
  rule: Rule | undefined,
  ruleData: RuleData | undefined,
): RuleData {
  if (ruleData) return ruleData;
  if (rule)
    return {
      name: rule.name,
      description: rule.description ?? "",
      at: rule.at ?? undefined,
      assign: rule.assign,
      repeat: rule.repeat,
      repeatPart: rule.repeatPart,
    };
  return defaultRuleData;
}

export default function RuleCreate(props: RuleCreateProps) {
  const [data, setData] = useState<RuleData>(
    getInitialRuleData(props.initialRule, props.initialData),
  );
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        props.onSubmit(data).finally(() => setLoading(false));
      }}
    >
      <FormControl>
        <Label htmlFor="name-input">Name</Label>
        <Input
          id="name-input"
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
        />
      </FormControl>
      <FormControl>
        <Label htmlFor="description-input">Description</Label>
        <Input
          id="description-input"
          value={data.description}
          onChange={(e) =>
            setData((d) => ({ ...d, description: e.target.value }))
          }
        />
      </FormControl>
      <FormControl>
        <Label htmlFor="assign-input">Assign</Label>
        <div>
          <div className="flex items-center">
            <AssignableSelect
              id="assign-input"
              value={data.assign}
              onChange={(assign) => setData((d) => ({ ...d, assign }))}
            />
            {data.assign && (
              <ExternalLink
                href={soundtrackUrl("/discover/music/" + data.assign)}
                className="ml-3 text-sm"
              >
                Open in Soundtrack
              </ExternalLink>
            )}
          </div>
          {data.assign && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-1"
              onClick={(e) => {
                e.preventDefault();
                setData((d) => ({ ...d, assign: null }));
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </FormControl>
      <FormControl>
        <Label htmlFor="at-input">Date & time</Label>
        <div>
          <DatePicker
            id="at-input"
            value={data.at}
            onChange={(v) => setData((d) => ({ ...d, at: v }))}
          />
        </div>
      </FormControl>
      <FormControl>
        <div className="flex items-center">
          <Label htmlFor="repeat-cb">Repeat</Label>
          <Checkbox
            id="repeat-cb"
            checked={data.repeat !== null}
            onCheckedChange={(checked) => {
              if (checked) {
                setData((d) => ({ ...d, repeat: 1, repeatPart: "day" }));
              } else {
                setData((d) => ({ ...d, repeat: null, repeatPart: null }));
              }
            }}
            className="ml-2"
          />
        </div>
      </FormControl>
      <FormControl>
        <div className="flex items-center">
          <Input
            type="number"
            min={1}
            value={data.repeat ?? ""}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (isNaN(v) || v < 1) return;
              setData((d) => ({ ...d, repeat: v }));
            }}
            disabled={data.repeat === null}
            placeholder="Repeat every"
            className="w-[150px]"
          />
          <RepeatPartSelect
            value={data.repeatPart}
            onChange={(part) => setData((d) => ({ ...d, repeatPart: part }))}
            disabled={data.repeat === null}
            className="ml-2"
          />
        </div>
      </FormControl>
      <div className="mt-4">
        <Button type="submit" disabled={loading}>
          {props.action}
        </Button>
        {props.onCancel && (
          <Button className="ml-2" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <ErrorAlert error={props.error} className="mt-2" />
    </form>
  );
}

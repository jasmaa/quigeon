import React from "react";
import {
  Button,
  SpaceBetween,
  Grid,
  Input,
} from "@cloudscape-design/components";
import { RequestHeader } from "@quigeon/interfaces";
import RichInput from "@quigeon/components/RichInput";

const PREDEFINED_HEADERS = [
  {
    key: "Authorization",
    value: "<calculated value>",
    editable: false,
  },
  {
    key: "x-amz-date",
    value: "<calculated value>",
    editable: false,
  },
  {
    key: "x-amz-content-sha256",
    value: "<calculated value>",
    editable: false,
  },
];

export default function RequestHeaderEditor({
  headers,
  onChange,
}: {
  headers: RequestHeader[];
  onChange: (headers: RequestHeader[]) => void;
}) {
  return (
    <SpaceBetween size="m">
      {[...PREDEFINED_HEADERS, ...headers].map((header, idx) => (
        <Grid
          key={idx}
          gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}
        >
          <Input
            value={header.key}
            placeholder="Key"
            disabled={!header.editable}
            onChange={({ detail }) => {
              const updatedHeaders = structuredClone(headers);
              updatedHeaders[idx - PREDEFINED_HEADERS.length].key =
                detail.value;
              onChange(updatedHeaders);
            }}
          />
          <RichInput
            value={header.value}
            placeholder="Value"
            disabled={!header.editable}
            onChange={({ detail }) => {
              const updatedHeaders = structuredClone(headers);
              updatedHeaders[idx - PREDEFINED_HEADERS.length].value =
                detail.value;
              onChange(updatedHeaders);
            }}
          />
          <Button
            iconName="remove"
            variant="inline-icon"
            disabled={!header.editable}
            onClick={(e) => {
              e.preventDefault();
              const updatedHeaders = [...headers];
              updatedHeaders.splice(idx - PREDEFINED_HEADERS.length, 1);
              onChange(updatedHeaders);
            }}
          />
        </Grid>
      ))}
      <Button
        onClick={(e) => {
          e.preventDefault();
          const updatedHeaders = [
            ...headers,
            {
              key: "",
              value: "",
              editable: true,
            },
          ];
          onChange(updatedHeaders);
        }}
      >
        Add
      </Button>
    </SpaceBetween>
  );
}

import React from "react";
import { Button, SpaceBetween, Grid, Input } from "@cloudscape-design/components";

export interface RequestHeader {
  key: string,
  value: string,
  editable: boolean,
}

export default function RequestHeaderEditor({
  headers,
  onChange,
}: {
  headers: RequestHeader[],
  onChange: (headers: RequestHeader[]) => void,
}) {
  return (
    <SpaceBetween size="m">
      {headers.map((header, idx) => (
        <Grid gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}>
          <Input value={header.key} placeholder="Key" disabled={!header.editable} onChange={({ detail }) => {
            const updatedHeaders = [...headers];
            updatedHeaders[idx].key = detail.value;
            onChange(updatedHeaders);
          }} />
          <Input value={header.value} placeholder="Value" disabled={!header.editable} onChange={({ detail }) => {
            const updatedHeaders = [...headers];
            updatedHeaders[idx].value = detail.value;
            onChange(updatedHeaders);
          }} />
          <Button iconName="remove" variant="inline-icon" disabled={!header.editable} onClick={(e) => {
            e.preventDefault();
            const updatedHeaders = [...headers];
            updatedHeaders.splice(idx, 1);
            onChange(updatedHeaders);
          }} />
        </Grid>
      ))}
      <Button onClick={(e) => {
        e.preventDefault();
        const updatedHeaders = [...headers, {
          key: "",
          value: "",
          editable: true,
        }];
        onChange(updatedHeaders);
      }}>Add</Button>
    </SpaceBetween>
  );
}
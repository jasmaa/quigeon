import React from "react";
import { Button, SpaceBetween, Grid, Input } from "@cloudscape-design/components";
import { Variable } from "@quigeon/interfaces";

export default function VariableEditor({
  variables,
  onChange,
}: {
  variables: Variable[],
  onChange: (variable: Variable[]) => void,
}) {
  return (
    <SpaceBetween size="m">
      {
        ...variables.map((variable, idx) => (
          <Grid key={idx} gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}>
            <Input value={variable.name} placeholder="Name" onChange={({ detail }) => {
              const updatedVariables = [...variables];
              updatedVariables[idx].name = detail.value;
              onChange(updatedVariables);
            }} />
            <Input value={variable.value} placeholder="Value" onChange={({ detail }) => {
              const updatedVariables = [...variables];
              updatedVariables[idx].value = detail.value;
              onChange(updatedVariables);
            }} />
            <Button iconName="remove" variant="inline-icon" onClick={(e) => {
              e.preventDefault();
              const updatedVariables = [...variables];
              updatedVariables.splice(idx, 1);
              onChange(updatedVariables);
            }} />
          </Grid>
        ))}
      <Button onClick={(e) => {
        e.preventDefault();
        const updatedVariables = [...variables, {
          name: "",
          value: "",
        }];
        onChange(updatedVariables);
      }}>Add</Button>
    </SpaceBetween>
  );
}
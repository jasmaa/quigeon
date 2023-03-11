import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri"
import { Button, SpaceBetween, Grid, Input, Select, Container, Header, Tabs, Textarea, FormField } from "@cloudscape-design/components";
import { OptionDefinition } from "@cloudscape-design/components/internal/components/option/interfaces";

export default function Home() {
  const [greeting, setGreeting] = useState("");
  const [accessKey, setAccessKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [methodOption, setMethodOption] = useState<OptionDefinition>({ label: "GET", value: "get" });
  const [url, setUrl] = useState<string>("");
  const [body, setBody] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const text = await invoke('greet', { name: 'World' }) as string;
      setGreeting(text);
    })();
  }, []);

  return (
    <SpaceBetween size="l" direction="vertical">
      <Container>
        <Grid gridDefinition={[{ colspan: 2 }, { colspan: 8 }, { colspan: 2 }]}>
          <Select
            selectedOption={methodOption}
            onChange={({ detail }) => {
              setMethodOption(detail.selectedOption);
            }
            }
            options={[
              { label: "GET", value: "get" },
              { label: "HEAD", value: "head" },
              { label: "POST", value: "post" },
              { label: "PUT", value: "put" },
              { label: "DELETE", value: "delete" },
              { label: "CONNECT", value: "connect" },
              { label: "OPTIONS", value: "options" },
              { label: "TRACE", value: "trace" },
              { label: "PATCH", value: "patch" },
            ]}
            selectedAriaLabel="Selected"
          />
          <Input value={url} placeholder="URL" onChange={({ detail }) => {
            setUrl(detail.value);
          }} />
          <Button>Send</Button>
        </Grid>
        <Tabs
          tabs={[
            {
              label: "Authorization",
              id: "authorization",
              content: (
                <SpaceBetween size="s" direction="vertical">
                  <FormField
                    label="Access Key">
                    <Input value={accessKey} placeholder="Access key" onChange={({ detail }) => {
                      setAccessKey(detail.value);
                    }} />
                  </FormField>
                  <FormField
                    label="Secret Key">
                    <Input value={secretKey} placeholder="Secret key" onChange={({ detail }) => {
                      setSecretKey(detail.value);
                    }} />
                  </FormField>
                  <FormField
                    label="Region">
                    <Input value={region} placeholder="Region" onChange={({ detail }) => {
                      setRegion(detail.value);
                    }} />
                  </FormField>
                  <FormField
                    label="Service">
                    <Input value={service} placeholder="Service" onChange={({ detail }) => {
                      setService(detail.value);
                    }} />
                  </FormField>
                </SpaceBetween>
              ),
            },
            {
              label: "Body",
              id: "body",
              content: (
                <Textarea
                  onChange={({ detail }) => setBody(detail.value)}
                  value={body}
                  placeholder="Body"
                  rows={10}
                />
              )
            },
          ]}
        />
      </Container>
      <Container header={<Header variant="h2">Response</Header>}>
        <p>{greeting}</p>
      </Container>
    </SpaceBetween>
  );
}
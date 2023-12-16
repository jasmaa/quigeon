import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Box, Button, Header, Modal, SpaceBetween } from "@cloudscape-design/components";
import { Request, ResponsePayload, CollectionDisplay, RequestDisplay, Environment } from "@quigeon/interfaces";
import { getOrCreateStore } from "@quigeon/store";
import CollectionNavigation from "@quigeon/components/CollectionNavigation";
import RequestContainer from "@quigeon/components/RequestContainer";
import ResponseContainer from "@quigeon/components/ResponseContainer";
import { generateVariableSubsitutedRequest, getDefaultEnvironment, getDefaultRequestDisplay } from "@quigeon/generators";
import VariableEditor from "@quigeon/components/VariableEditor";

// Request id for matching current request when multiple requests are in flight
let pendingRequestId: string | null = null;

export default function Home() {
  const [collectionDisplays, setCollectionDisplays] = useState<CollectionDisplay[]>([]);
  const [requestDisplay, setRequestDisplay] = useState<RequestDisplay>(getDefaultRequestDisplay());
  const [environment, setEnvironment] = useState<Environment>();
  const [isVariableModalVisible, setIsVariableModalVisible] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const collectionDisplays = await loadCollectionDisplays();
      setCollectionDisplays(collectionDisplays);
      const environment = await loadOrCreateDefaultEnvironment();
      setEnvironment(environment);
    })();
  }, []);

  const loadCollectionDisplays = async () => {
    const store = await getOrCreateStore();

    const collectionDisplays = [];
    const collections = await store.listCollections();

    for (const collection of collections) {
      const requests = await store.listRequests(collection.id);
      const collectionDisplay = {
        collection,
        requests,
        isOpen: false,
      };
      collectionDisplays.push(collectionDisplay);
    }

    return collectionDisplays;
  }

  const loadOrCreateDefaultEnvironment = async () => {
    const store = await getOrCreateStore();
    const environments = await store.listEnvironments();
    if (environments.length <= 0) {
      const environment = getDefaultEnvironment();
      await store.upsertEnvironment(environment);
      return environment;
    } else {
      return environments[0];
    }
  }

  const onSendRequest = (request: Request) => {
    // Generate a unique id for this request
    const currentRequestId = crypto.randomUUID();
    pendingRequestId = currentRequestId;

    setIsSendingRequest(true);
    setResponse(undefined);
    setResponseErrorText("");
    (async () => {
      try {
        const sendableRequest = generateVariableSubsitutedRequest(request, environment!.variables);
        const res = await invoke('send_sigv4_cmd', {
          ...sendableRequest,
          headers: sendableRequest.headers.filter((header) => header.editable),
        }) as ResponsePayload;
        // Only update if this request is still the current request
        if (pendingRequestId === currentRequestId) {
          setResponse(res);
        }
      } catch (err) {
        console.error(err);
        if (pendingRequestId === currentRequestId) {
          setResponseErrorText((err as Error).toString());
        }
      } finally {
        if (pendingRequestId === currentRequestId) {
          pendingRequestId = null;
          setIsSendingRequest(false);
        }
      }
    })();
  }

  const onCancelSend = () => {
    pendingRequestId = null;
    setIsSendingRequest(false);
    setResponseErrorText("Request cancelled");
  }

  return (
    <>
      <Modal
        visible={isVariableModalVisible}
        onDismiss={() => setIsVariableModalVisible(false)}
        header={<Header variant="h2">Environment Variables</Header>}
      >
        <VariableEditor
          variables={environment?.variables ?? []}
          onChange={async (variables) => {
            if (environment) {
              const updatedEnvironment = { ...environment };
              updatedEnvironment.variables = variables;
              setEnvironment(updatedEnvironment);

              const store = await getOrCreateStore();
              await store.upsertEnvironment(updatedEnvironment);
            }
          }}
        />
      </Modal>
      <Box margin="s">
        <div style={{ display: "flex" }}>
          <div style={{ paddingRight: "1em" }}>
            <SpaceBetween size="l" direction="vertical">
              <CollectionNavigation
                collectionDisplays={collectionDisplays}
                setCollectionDisplays={setCollectionDisplays}
                requestDisplay={requestDisplay}
                setRequestDisplay={setRequestDisplay}
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
              />
            </SpaceBetween>
          </div>
          <div style={{ flexGrow: 1, paddingRight: "1em" }}>
            <SpaceBetween size="l" direction="vertical">
              <RequestContainer
                collectionDisplays={collectionDisplays}
                setCollectionDisplays={setCollectionDisplays}
                requestDisplay={requestDisplay}
                setRequestDisplay={setRequestDisplay}
                onSend={onSendRequest}
              />
              <ResponseContainer
                response={response}
                loading={isSendingRequest}
                errorText={responseErrorText}
                onCancel={onCancelSend}
              />
            </SpaceBetween>
          </div>
          <div>
            <SpaceBetween size="m" direction="vertical">
              <Button iconName="key" variant="icon" onClick={(e) => {
                setIsVariableModalVisible(true);
              }} />
            </SpaceBetween>
          </div>
        </div>
      </Box>
    </>
  );
}
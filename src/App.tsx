import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Alert,
  Box,
  Button,
  Header,
  Link,
  Modal,
  SpaceBetween,
  TextContent,
} from "@cloudscape-design/components";
import {
  Request,
  ResponsePayload,
  CollectionDisplay,
  RequestDisplay,
  Environment,
} from "@quigeon/interfaces";
import { getOrCreateStore } from "@quigeon/store";
import CollectionNavigation from "@quigeon/components/CollectionNavigation";
import RequestContainer from "@quigeon/components/RequestContainer";
import ResponseContainer from "@quigeon/components/ResponseContainer";
import {
  generateAwscurl,
  generateVariableSubsitutedRequest,
  getDefaultEnvironment,
  getDefaultRequestDisplay,
} from "@quigeon/generators";
import VariableEditor from "@quigeon/components/VariableEditor";
import CodeBlock from "@quigeon/components/CodeBlock";

export default function Home() {
  const [collectionDisplays, setCollectionDisplays] = useState<
    CollectionDisplay[]
  >([]);
  const [requestDisplay, setRequestDisplay] = useState<RequestDisplay>(
    getDefaultRequestDisplay(),
  );
  const [environment, setEnvironment] = useState<Environment>();
  const [isVariableModalVisible, setIsVariableModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [awscurlCodeSnippet, setAwscurlCodeSnippet] = useState<string>("");
  const [awscurlErrorMessage, setAwscurlErrorMessage] = useState<string>();

  const pendingRequestId = useRef<string>();

  useEffect(() => {
    (async () => {
      const collectionDisplays = await loadCollectionDisplays();
      setCollectionDisplays(collectionDisplays);
      const environment = await loadOrCreateDefaultEnvironment();
      setEnvironment(environment);
    })();
  }, []);

  useEffect(() => {
    setAwscurlErrorMessage(undefined);
    try {
      const updatedAwscurlCodeSnippet = generateAwscurl(
        environment
          ? generateVariableSubsitutedRequest(
            requestDisplay.request,
            environment.variables,
          )
          : requestDisplay.request,
      );
      setAwscurlCodeSnippet(updatedAwscurlCodeSnippet);
    } catch (e) {
      if (e instanceof Error) {
        setAwscurlErrorMessage(`awscurl code snippet could not be displayed: ${e.message}`);
      }
    }
  }, [requestDisplay.request, environment]);

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
  };

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
  };

  const onSendRequest = (request: Request) => {
    // Generate a unique id for this request
    const currentRequestId = crypto.randomUUID();
    pendingRequestId.current = currentRequestId;

    setIsSendingRequest(true);
    setResponse(undefined);
    setResponseErrorText("");

    (async () => {
      try {
        const sendableRequest = generateVariableSubsitutedRequest(
          request,
          environment!.variables,
        );
        const res = (await invoke("send_sigv4_cmd", {
          ...sendableRequest,
          headers: sendableRequest.headers.filter((header) => header.editable),
        })) as ResponsePayload;
        // Only update if this request is still the current request
        if (pendingRequestId.current === currentRequestId) {
          setResponse(res);
        }
      } catch (err) {
        console.error(err);
        if (pendingRequestId.current === currentRequestId) {
          setResponseErrorText((err as Error).toString());
        }
      } finally {
        if (pendingRequestId.current === currentRequestId) {
          pendingRequestId.current = undefined;
          setIsSendingRequest(false);
        }
      }
    })();
  };

  const onCancelSend = () => {
    pendingRequestId.current = undefined;
    setIsSendingRequest(false);
    setResponseErrorText("Request cancelled");
  };

  return (
    <>
      <Modal
        visible={isVariableModalVisible}
        onDismiss={() => setIsVariableModalVisible(false)}
        header={
          <Header
            variant="h2"
            description="Variables for your default environment."
          >
            Environment Variables
          </Header>
        }
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
      <Modal
        visible={isExportModalVisible}
        onDismiss={() => setIsExportModalVisible(false)}
        header={
          <Header
            variant="h2"
            description={
              <TextContent>
                Exports request as an awscurl command.{" "}
                <Link external href="https://github.com/okigan/awscurl">
                  Learn more
                </Link>
              </TextContent>
            }
          >
            Export request
          </Header>
        }
      >
        {
          awscurlErrorMessage
            ? <Alert type="error">{awscurlErrorMessage}</Alert>
            : <CodeBlock
              code={awscurlCodeSnippet}
              language="bash"
              copyEnabled
            />
        }
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
            <SpaceBetween size="s" direction="vertical">
              <Button
                iconName="key"
                variant="icon"
                onClick={() => {
                  setIsVariableModalVisible(true);
                }}
              />
              <Button
                iconName="download"
                variant="icon"
                onClick={() => {
                  setIsExportModalVisible(true);
                }}
              />
            </SpaceBetween>
          </div>
        </div>
      </Box>
    </>
  );
}

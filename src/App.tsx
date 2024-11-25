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
import { getOrCreateAppStorage } from "@quigeon/app-storage";
import CollectionNavigation from "@quigeon/components/CollectionNavigation";
import RequestContainer from "@quigeon/components/RequestContainer";
import ResponseContainer from "@quigeon/components/ResponseContainer";
import {
  generateAwscurl,
  generateVariableSubsitutedRequest,
  getDefaultEnvironment,
} from "@quigeon/generators";
import VariableEditor from "@quigeon/components/VariableEditor";
import CodeBlock from "@quigeon/components/CodeBlock";
import { connect } from "react-redux";
import { loadCollectionDisplays } from "./redux/collections-slice";
import { AppDispatch, RootState } from "./redux/store";

interface StateProps {
  collectionDisplays: CollectionDisplay[];
  requestDisplay: RequestDisplay;
}

interface DispatchProps {
  loadCollectionDisplays: () => Promise<void>;
}

type Props = StateProps & DispatchProps;

function App(props: Props) {
  const { requestDisplay } = props;

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
      await props.loadCollectionDisplays();
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
        setAwscurlErrorMessage(
          `awscurl code snippet could not be displayed: ${e.message}`,
        );
      }
    }
  }, [requestDisplay.request, environment]);

  const loadOrCreateDefaultEnvironment = async () => {
    const appStorage = await getOrCreateAppStorage();
    const environments = await appStorage.listEnvironments();
    if (environments.length <= 0) {
      const environment = getDefaultEnvironment();
      await appStorage.upsertEnvironment(environment);
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

              const appStorage = await getOrCreateAppStorage();
              await appStorage.upsertEnvironment(updatedEnvironment);
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
        {awscurlErrorMessage ? (
          <Alert type="error">{awscurlErrorMessage}</Alert>
        ) : (
          <CodeBlock code={awscurlCodeSnippet} language="bash" copyEnabled />
        )}
      </Modal>
      <Box margin="s">
        <div style={{ display: "flex" }}>
          <div style={{ paddingRight: "1em" }}>
            <SpaceBetween size="l" direction="vertical">
              <CollectionNavigation
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
              />
            </SpaceBetween>
          </div>
          <div style={{ flexGrow: 1, paddingRight: "1em" }}>
            <SpaceBetween size="l" direction="vertical">
              <RequestContainer
                loading={isSendingRequest}
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

const mapStateToProps = (state: RootState) => {
  return {
    collectionDisplays: state.collections.collectionDisplays,
    requestDisplay: state.activeRequest.requestDisplay,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => {
  return {
    loadCollectionDisplays: () => dispatch(loadCollectionDisplays()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

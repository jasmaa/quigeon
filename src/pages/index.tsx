import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Box, SpaceBetween } from "@cloudscape-design/components";
import { Request, ResponsePayload, CollectionDisplay, RequestDisplay } from "@quigeon/interfaces";
import { getOrCreateStore } from "@quigeon/store";
import CollectionNavigation from "@quigeon/components/CollectionNavigation";
import RequestContainer from "@quigeon/components/RequestContainer";
import ResponseContainer from "@quigeon/components/ResponseContainer";
import { getDefaultRequestDisplay } from "@quigeon/generators";

// Request id for matching current request when multiple requests are in flight
let pendingRequestId: string | null = null;

export default function Home() {
  const [collectionDisplays, setCollectionDisplays] = useState<CollectionDisplay[]>([]);
  const [requestDisplay, setRequestDisplay] = useState<RequestDisplay>(getDefaultRequestDisplay());
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const collectionDisplays = await loadCollectionDisplays();
      setCollectionDisplays(collectionDisplays);
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

  const onSendRequest = (request: Request) => {
    // Generate a unique id for this request
    const currentRequestId = crypto.randomUUID();
    pendingRequestId = currentRequestId;

    setIsSendingRequest(true);
    setResponse(undefined);
    setResponseErrorText("");
    (async () => {
      try {
        const res = await invoke('send_sigv4_cmd', {
          ...request,
          headers: request.headers.filter((header) => header.editable),
        }) as ResponsePayload;
        // Only update if this request is still the current request
        if (pendingRequestId === currentRequestId) {
          setResponse(res);
        }
      } catch (err) {
        console.error(err);
        if (pendingRequestId === currentRequestId) {
          setResponseErrorText("error");
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
    <Box margin="s">
      <div style={{ display: "flex" }}>
        <div style={{ paddingRight: "1em" }}>
          <CollectionNavigation
            collectionDisplays={collectionDisplays}
            setCollectionDisplays={setCollectionDisplays}
            requestDisplay={requestDisplay}
            setRequestDisplay={setRequestDisplay}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
          />
        </div>
        <div style={{ flexGrow: 1 }}>
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
      </div>
    </Box>
  );
}
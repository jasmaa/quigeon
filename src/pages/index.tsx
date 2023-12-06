import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Box, SpaceBetween, Grid } from "@cloudscape-design/components";
import { Request, ResponsePayload, CollectionDisplay, RequestDisplay } from "@awspostman/interfaces";
import { getOrCreateStore, generateId } from "@awspostman/store";
import CollectionNavigation from "@awspostman/components/CollectionNavigation";
import RequestContainer from "@awspostman/components/RequestContainer";
import ResponseContainer from "@awspostman/components/ResponseContainer";

// Request id for matching current request when multiple requests are in flight
let pendingRequestId: string | null = null;

export default function Home() {
  const [collectionDisplays, setCollectionDisplays] = useState<CollectionDisplay[]>([]);
  const [requestDisplay, setRequestDisplay] = useState<RequestDisplay>({
    request: {
      id: generateId(),
      name: "My Request",
      collectionId: "",
      accessKey: "",
      secretKey: "",
      sessionToken: "",
      region: "",
      service: "",
      method: "GET",
      url: "",
      body: "",
      headers: [],
    }
  });
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");

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

  const onCollectionDisplaysChange = (updatedCollectionDisplays: CollectionDisplay[]) => {
    setCollectionDisplays(updatedCollectionDisplays);

    if (requestDisplay.indices) {
      const updatedRequestDisplay = structuredClone(requestDisplay);
      updatedRequestDisplay.request = structuredClone(updatedCollectionDisplays[requestDisplay.indices.collectionDisplayIdx].requests[requestDisplay.indices.requestIdx]);
      setRequestDisplay(updatedRequestDisplay);
    }
  }

  const onRequestDisplayChange = async (updatedRequestDisplay: RequestDisplay) => {
    setRequestDisplay(updatedRequestDisplay);

    if (updatedRequestDisplay.indices) {
      const updatedCollectionDisplays = structuredClone(collectionDisplays);
      updatedCollectionDisplays[updatedRequestDisplay.indices.collectionDisplayIdx].requests[updatedRequestDisplay.indices.requestIdx] = structuredClone(updatedRequestDisplay.request);
      setCollectionDisplays(updatedCollectionDisplays);
    }
  };

  const onOpenRequest = (collectionDisplayIdx: number, requestIdx: number) => {
    const requestDisplay = {
      request: structuredClone(collectionDisplays[collectionDisplayIdx].requests[requestIdx]),
      collection: structuredClone(collectionDisplays[collectionDisplayIdx].collection),
      indices: {
        collectionDisplayIdx,
        requestIdx,
      }
    }
    setRequestDisplay(requestDisplay);
  }

  return (
    <Box margin="s">
      <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
        <CollectionNavigation
          collectionDisplays={collectionDisplays}
          onChange={onCollectionDisplaysChange}
          onOpenRequest={onOpenRequest}
        />
        <SpaceBetween size="l" direction="vertical">
          <RequestContainer
            requestDisplay={requestDisplay}
            onSend={onSendRequest}
            onChange={onRequestDisplayChange}
          />
          <ResponseContainer
            response={response}
            loading={isSendingRequest}
            errorText={responseErrorText}
            onCancel={onCancelSend}
          />
        </SpaceBetween>
      </Grid>
    </Box>
  );
}
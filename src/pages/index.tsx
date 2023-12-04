import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Box, SpaceBetween, Grid } from "@cloudscape-design/components";
import { CollectionPartial, RequestPayload, ResponsePayload, CollectionDisplay, RequestDisplay } from "@awspostman/interfaces";
import { generateId } from "@awspostman/file";
import CollectionNavigation from "@awspostman/components/CollectionNavigation";
import RequestContainer from "@awspostman/components/RequestContainer";
import ResponseContainer from "@awspostman/components/ResponseContainer";
import Store from "@awspostman/store";

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
      await loadStore();
    })();
  }, []);

  const loadStore = async () => {
    const store = new Store("sqlite:test.db");
    await store.initialize();

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

    setCollectionDisplays(collectionDisplays);
  }

  const onSendRequest = (request: RequestPayload) => {
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

  const saveRequest = async (request: RequestPayload) => {
    const store = new Store("sqlite:test.db");
    await store.initialize();
    await store.upsertRequest(request);
    console.log("saved");
  }

  const saveCollection = async (collection: CollectionPartial) => {
    const store = new Store("sqlite:test.db");
    await store.initialize();
    await store.upsertCollection(collection);
    console.log("saved");
  }

  const deleteCollection = async (targetCollection: CollectionPartial) => {
    const store = new Store("sqlite:test.db");
    await store.initialize();
    await store.deleteCollection(targetCollection.id);
  }

  const onRequestChange = async (updatedRequestDisplay: RequestDisplay) => {
    await saveRequest(updatedRequestDisplay.request);

    setRequestDisplay(updatedRequestDisplay);

    if (updatedRequestDisplay.indices) {
      const updatedCollectionDisplays = [...collectionDisplays];
      const updatedRequests = [...collectionDisplays[updatedRequestDisplay.indices.collectionDisplayIdx].requests];
      updatedRequests[updatedRequestDisplay.indices.requestIdx] = updatedRequestDisplay.request;
      updatedCollectionDisplays[updatedRequestDisplay.indices.collectionDisplayIdx].requests = updatedRequests;
      setCollectionDisplays(updatedCollectionDisplays);
    }
  };

  return (
    <Box margin={"s"}>
      <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
        <CollectionNavigation
          collectionDisplays={collectionDisplays}
          setCollectionDisplays={setCollectionDisplays}
          setRequestDisplay={setRequestDisplay}
          saveRequest={saveRequest}
          saveCollection={saveCollection}
          deleteCollection={deleteCollection}
        />
        <SpaceBetween size="l" direction="vertical">
          <RequestContainer
            requestDisplay={requestDisplay}
            onSend={onSendRequest}
            onChange={onRequestChange}
          />
          <ResponseContainer
            response={response}
            loading={isSendingRequest}
            errorText={responseErrorText}
            onCancel={() => {
              pendingRequestId = null;
              setIsSendingRequest(false);
              setResponseErrorText("Request cancelled");
            }}
          />
        </SpaceBetween>
      </Grid>
    </Box>
  );
}
import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { readDir, createDir, readTextFile, writeTextFile, renameFile, exists, BaseDirectory } from '@tauri-apps/api/fs';
import { Box, SpaceBetween, Grid } from "@cloudscape-design/components";
import { RequestPartial, CollectionPartial, RequestPayload, ResponsePayload } from "@awspostman/interfaces";
import { generateId, parseRequestFileName } from "@awspostman/file";
import CollectionNavigation from "@awspostman/components/CollectionNavigation";
import RequestContainer from "@awspostman/components/RequestContainer";
import ResponseContainer from "@awspostman/components/ResponseContainer";
import { debounce } from "@awspostman/debounce";

// Request id for matching current request when multiple requests are in flight
let pendingRequestId: string | null = null;

export default function Home() {
  const [collections, setCollections] = useState<CollectionPartial[]>([]);
  const [request, setRequest] = useState<RequestPayload>({
    id: generateId(),
    name: "request",
    collectionName: "",
    accessKey: "",
    secretKey: "",
    sessionToken: "",
    region: "",
    service: "",
    method: "GET",
    url: "",
    body: "",
    headers: [],
  });
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const loadCollections = async () => {
    const isCollectionsExists = await exists('collections', { dir: BaseDirectory.AppData });
    if (!isCollectionsExists) {
      // Create collections directory if does not exist
      await createDir('collections', { dir: BaseDirectory.AppData, recursive: true });
    }

    // Load collections and requests from directory
    const collectionEntries = await readDir('collections', { dir: BaseDirectory.AppData });
    const loadedCollections: CollectionPartial[] = await Promise.all(
      collectionEntries.map(async (collectionEntry) => {
        const requestEntries = await readDir(`collections/${collectionEntry.name}`, { dir: BaseDirectory.AppData });
        const requests = requestEntries.map((requestEntry) => {
          // Request file name follows <METHOD>-<NAME>.json format
          try {
            const { id, name, method } = parseRequestFileName(requestEntry.name!);
            const request: RequestPartial = {
              id,
              name,
              collectionName: collectionEntry.name!,
              method,
            };
            return request;
          } catch (err) {
            return null;
          }
        }).filter(request => request) as RequestPartial[];
        const collection: CollectionPartial = {
          name: collectionEntry.name!,
          isOpen: false,
          requests,
        }
        return collection;
      })
    );

    return loadedCollections;
  }

  useEffect(() => {
    (async () => {
      const loadedCollections = await loadCollections();
      setCollections(loadedCollections);
    })();
  }, []);

  const onOpenRequest = (request: RequestPartial) => {
    (async () => {
      const requestPath = `collections/${request.collectionName}/${request.id}-${request.method}-${request.name}.json`;
      const blob: string = await readTextFile(requestPath, { dir: BaseDirectory.AppConfig });
      const requestContent = JSON.parse(blob);
      if (requestContent) {
        const updatedRequest = {
          ...requestContent,
          ...request,
        };
        setRequest(updatedRequest);
      }
    })();
  };

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
          setResponseErrorText(err as string);
        }
      } finally {
        if (pendingRequestId === currentRequestId) {
          pendingRequestId = null;
          setIsSendingRequest(false);
        }
      }
    })();
  }

  const saveRequest = useCallback(debounce((request: RequestPayload) => {
    (async () => {
      if (request.collectionName) {
        const updatedRequestPath = `collections/${request.collectionName}/${request.id}-${request.method}-${request.name}.json`;
        const requestEntries = await readDir(`collections/${request.collectionName}`, { dir: BaseDirectory.AppData });
        const targetRequestEntry = requestEntries.find((requestEntry) => requestEntry.name?.startsWith(request.id));
        await renameFile(targetRequestEntry!.path, updatedRequestPath, { dir: BaseDirectory.AppData });
        await writeTextFile(updatedRequestPath, JSON.stringify(request), { dir: BaseDirectory.AppData });
        console.log("saved");
      }
    })();
  }, 500), []);

  const onRequestChange = (updatedRequest: RequestPayload) => {
    setRequest(updatedRequest);

    // Update collections
    const updatedCollections = [...collections];
    const targetCollection = updatedCollections.find(({ name }) => name === updatedRequest.collectionName);
    const targetRequest = targetCollection?.requests.find(({ id }) => id === updatedRequest.id);
    if (targetRequest) {
      targetRequest.name = updatedRequest.name;
      targetRequest.method = updatedRequest.method;
    }
    setCollections(updatedCollections);

    saveRequest(updatedRequest);
  };

  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");

  return (
    <Box margin={"s"}>
      <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
        <CollectionNavigation
          collections={collections}
          onChange={(updatedCollections) => {
            setCollections(updatedCollections)
          }}
          onOpenRequest={onOpenRequest}
        />
        <SpaceBetween size="l" direction="vertical">
          <RequestContainer
            request={request}
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
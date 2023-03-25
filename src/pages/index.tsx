import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { readDir, createDir, readTextFile, writeTextFile, renameFile, exists, BaseDirectory } from '@tauri-apps/api/fs';
import { Box, SpaceBetween, Grid } from "@cloudscape-design/components";
import { RequestPartial, CollectionPartial, RequestPayload, ResponsePayload } from "@awspostman/interfaces";
import { generateId, parseRequestFileName, parseCollectionFolderName, constructCollectionFolderName, constructRequestFileName } from "@awspostman/file";
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
    name: "My Request",
    collectionId: "",
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
  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");

  useEffect(() => {
    (async () => {
      const loadedCollections = await loadCollections();
      setCollections(loadedCollections);
    })();
  }, []);

  const loadCollections = async () => {
    const isCollectionsExists = await exists('collections', { dir: BaseDirectory.AppData });
    if (!isCollectionsExists) {
      // Create collections directory if does not exist
      await createDir('collections', { dir: BaseDirectory.AppData, recursive: true });
    }

    // Load collections and requests from directory
    const collectionEntries = await readDir('collections', { dir: BaseDirectory.AppData });
    const loadedCollections: CollectionPartial[] = await Promise.all(
      collectionEntries
        .map(async (collectionEntry) => {
          if (collectionEntry.name) {
            const collectionParse = parseCollectionFolderName(collectionEntry.name);
            const requestEntries = await readDir(`collections/${collectionEntry.name}`, { dir: BaseDirectory.AppData });
            const requests = requestEntries.map((requestEntry) => {
              try {
                const requestParse = parseRequestFileName(requestEntry.name!);
                const request: RequestPartial = {
                  id: requestParse.id,
                  name: requestParse.name,
                  collectionId: collectionParse.id,
                  collectionName: collectionParse.name,
                  method: requestParse.method,
                };
                return request;
              } catch (err) {
                return null;
              }
            }).filter(request => request) as RequestPartial[];
            const collection: CollectionPartial = {
              id: collectionParse.id,
              name: collectionParse.name,
              isOpen: false,
              requests,
            }
            return collection;
          }
        })
        .filter((collection) => !!collection)
    ) as CollectionPartial[];

    return loadedCollections;
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

  const saveRequest = useCallback(debounce((request: RequestPayload) => {
    (async () => {
      const collectionFolderName = constructCollectionFolderName(request.collectionId, request.collectionName);
      const requestFileName = constructRequestFileName(request.id, request.method, request.name);
      const updatedRequestPath = `collections/${collectionFolderName}/${requestFileName}`;
      const requestEntries = await readDir(`collections/${collectionFolderName}`, { dir: BaseDirectory.AppData });
      const targetRequestEntry = requestEntries.find((requestEntry) => requestEntry.name?.startsWith(request.id));
      if (targetRequestEntry) {
        // Update file name if request exists
        await renameFile(targetRequestEntry.path, updatedRequestPath, { dir: BaseDirectory.AppData });
      }
      await writeTextFile(updatedRequestPath, JSON.stringify(request), { dir: BaseDirectory.AppData });
      console.log("saved");
    })();
  }, 500), []);

  const saveCollection = useCallback(debounce((collection: CollectionPartial) => {
    (async () => {
      const collectionFolderName = constructCollectionFolderName(collection.id, collection.name);
      const updatedCollectionPath = `collections/${collectionFolderName}`;
      const collectionEntries = await readDir(`collections`, { dir: BaseDirectory.AppData });
      const targetCollectionEntry = collectionEntries.find((collectionEntry) => collectionEntry.name?.startsWith(collection.id));
      if (targetCollectionEntry) {
        // TODO: Update folder name if request exists
        // await renameFile(targetCollectionEntry.path, updatedCollectionPath, { dir: BaseDirectory.AppData });
      } else {
        // Otherwise, create a new folder
        await createDir(updatedCollectionPath, { dir: BaseDirectory.AppData, recursive: true });
      }
      console.log("saved");
    })();
  }, 500), []);


  const onOpenCollection = (updatedCollection: CollectionPartial) => {
    const updatedCollections = [...collections];
    const targetCollectionIdx = updatedCollections.findIndex(({ id }) => id === updatedCollection.id);
    updatedCollections[targetCollectionIdx].isOpen = !updatedCollections[targetCollectionIdx].isOpen;
    setCollections(updatedCollections);
  };

  const onOpenRequest = (request: RequestPartial) => {
    (async () => {
      const collectionFolderName = constructCollectionFolderName(request.collectionId, request.collectionName);
      const requestFileName = constructRequestFileName(request.id, request.method, request.name);
      const requestPath = `collections/${collectionFolderName}/${requestFileName}`;
      const blob: string = await readTextFile(requestPath, { dir: BaseDirectory.AppConfig });
      const requestContent = JSON.parse(blob);
      if (requestContent) {
        const updatedRequest = requestContent as RequestPayload;
        setRequest(updatedRequest);
      }
    })();
  };

  const onAddRequest = (addedRequest: RequestPayload) => {
    const updatedCollections = [...collections];
    const targetCollectionIdx = updatedCollections.findIndex(({ id }) => id === addedRequest.collectionId);
    updatedCollections[targetCollectionIdx].requests.push(addedRequest);
    setCollections(updatedCollections);

    saveRequest(addedRequest);
  };

  const onAddCollection = (addedCollection: CollectionPartial) => {
    const updatedCollections = [...collections, addedCollection];
    setCollections(updatedCollections);

    saveCollection(addedCollection);
  };

  const onRequestChange = (updatedRequest: RequestPayload) => {
    const updatedCollections = [...collections];
    const targetCollection = updatedCollections.find(({ id }) => id === updatedRequest.collectionId);
    const targetRequest = targetCollection?.requests.find(({ id }) => id === updatedRequest.id);
    if (targetRequest) {
      targetRequest.name = updatedRequest.name;
      targetRequest.method = updatedRequest.method;
    }
    setCollections(updatedCollections);
    setRequest(updatedRequest);

    saveRequest(updatedRequest);
  };

  return (
    <Box margin={"s"}>
      <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
        <CollectionNavigation
          collections={collections}
          onOpenCollection={onOpenCollection}
          onOpenRequest={onOpenRequest}
          onAddRequest={onAddRequest}
          onAddCollection={onAddCollection}
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
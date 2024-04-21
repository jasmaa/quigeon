import { describe, expect, it } from "vitest";
import { generateAwscurl, generateVariableSubsitutedRequest, getDefaultCollectionDisplay, getDefaultEnvironment, getDefaultRequest, getDefaultRequestDisplay } from "./generators";

describe("test getDefaultRequest", () => {
  it("should generate default", () => {
    const request = getDefaultRequest();
    expect(request).not.toBeNull();
    expect(request.name).toBe("My Request");
  });
});

describe("test getDefaultRequestDisplay", () => {
  it("should generate default", () => {
    const requestDisplay = getDefaultRequestDisplay();
    expect(requestDisplay).not.toBeNull();
    expect(requestDisplay.request.name).toBe("My Request");
    expect(requestDisplay.collection).toBeUndefined();
    expect(requestDisplay.indices).toBeUndefined();
  });
});


describe("test getDefaultCollectionDisplay", () => {
  it("should generate default", () => {
    const collectionDisplay = getDefaultCollectionDisplay();
    expect(collectionDisplay).not.toBeNull();
    expect(collectionDisplay.collection.name).toBe("My Collection");
    expect(collectionDisplay.isOpen).toBeFalsy();
  });
});

describe("test getDefaultEnvironment", () => {
  it("should generate default", () => {
    const enviironment = getDefaultEnvironment();
    expect(enviironment).not.toBeNull();
    expect(enviironment.name).toBe("Default");
  });
});

describe("test generateVariableSubsitutedRequest", () => {
  const request = {
    id: "5d2c2b84-e0ba-4fdf-858d-8b5e962d2e4d",
    name: "My ListBuckets",
    accessKey: "$AWS_ACCESS_KEY_ID",
    secretKey: "${AWS_SECRET_ACCESS_KEY}",
    sessionToken: "$AWS_SESSION_TOKEN",
    region: "$AWS_REGION",
    service: "s3",
    method: "GET",
    url: "https://s3.${AWS_REGION}.example.com",
    body: "",
    headers: [
      {
        key: "X-Example-Header",
        value: "var-${EXAMPLE}",
        editable: false,
      },
      {
        key: "X-Example-Header-2",
        value: "var-${EXAMPLE}",
        editable: true,
      },
      {
        key: "X-Region",
        value: "$AWS_REGION",
        editable: true,
      },
    ]
  };

  it("should subsitute when variables exist", () => {
    const variables = [
      {
        name: "AWS_ACCESS_KEY_ID",
        value: "access-key",
      },
      {
        name: "AWS_SECRET_ACCESS_KEY",
        value: "secret-key",
      },
      {
        name: "AWS_SESSION_TOKEN",
        value: "session-token",
      },
      {
        name: "AWS_REGION",
        value: "us-east-1",
      },
      {
        name: "EXAMPLE",
        value: "example",
      },
    ];

    const subbedRequest = generateVariableSubsitutedRequest(request, variables);

    const expectedSubbedRequest = {
      id: "5d2c2b84-e0ba-4fdf-858d-8b5e962d2e4d",
      name: "My ListBuckets",
      accessKey: "access-key",
      secretKey: "secret-key",
      sessionToken: "session-token",
      region: "us-east-1",
      service: "s3",
      method: "GET",
      url: "https://s3.us-east-1.example.com",
      body: "",
      headers: [
        {
          key: "X-Example-Header",
          value: "var-${EXAMPLE}",
          editable: false,
        },
        {
          key: "X-Example-Header-2",
          value: "var-example",
          editable: true,
        },
        {
          key: "X-Region",
          value: "us-east-1",
          editable: true,
        },
      ]
    };

    expect(subbedRequest).toStrictEqual(expectedSubbedRequest);
  });

  it("should error when variables do not exist", () => {
    const variables = [
      {
        name: "AWS_ACCESS_KEY_ID",
        value: "access-key",
      },
      {
        name: "AWS_SECRET_ACCESS_KEY",
        value: "secret-key",
      },
      {
        name: "AWS_SESSION_TOKEN",
        value: "session-token",
      },
      {
        name: "AWS_REGION",
        value: "us-east-1",
      },
    ];

    expect(() => {
      generateVariableSubsitutedRequest(request, variables)
    }).toThrowError();
  });
});

describe("test generateAwscurlRequest", () => {
  const request = {
    id: "5d2c2b84-e0ba-4fdf-858d-8b5e962d2e4d",
    name: "My CreateFunction",
    accessKey: "access-key",
    secretKey: "secret-key",
    sessionToken: "session-token",
    region: "us-east-1",
    service: "lambda",
    method: "POST",
    url: "https://lambda.us-east-1.example.com/2015-03-31/functions",
    body: `{ "FunctionName": "JasonFunction" }`,
    headers: [
      {
        key: "X-Region",
        value: "us-east-1",
        editable: true,
      },
      {
        key: "X-Example-Header",
        value: "var-example",
        editable: true,
      },
    ]
  };

  it("should generate awscurl request", () => {

    const awscurlPayload = generateAwscurl(request);

    const expectedAwscurlPayload = `awscurl \\
  -X 'POST' \\
  -d '{ "FunctionName": "JasonFunction" }' \\
  -H 'X-Region: us-east-1' \\
  -H 'X-Example-Header: var-example' \\
  --region 'us-east-1' \\
  --service 'lambda' \\
  --access_key 'access-key' \\
  --secret_key 'secret-key' \\
  --security_token 'session-token' \\
  'https://lambda.us-east-1.example.com/2015-03-31/functions'`

    expect(awscurlPayload).toBe(expectedAwscurlPayload);
  });
});
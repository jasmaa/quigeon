import { describe, expect, it } from "@jest/globals";
import { parseTextNodes } from "./parsing";

describe('test parseTextNodes', () => {
  it.each([
    [
      "",
      []
    ],
    [
      "a",
      [
        {
          type: "none",
          text: "a",
        },
      ]
    ],
    [
      "https://example.com",
      [
        {
          type: "none",
          text: "https://example.com",
        },
      ]
    ],
    [
      "https://example.com/$PATH",
      [
        {
          type: "none",
          text: "https://example.com/",
        },
        {
          type: "var",
          text: "$PATH",
          varMetadata: {
            name: "PATH",
          },
        },
      ]
    ],
    [
      "https://example.com/$PATH/123",
      [
        {
          type: "none",
          text: "https://example.com/",
        },
        {
          type: "var",
          text: "$PATH",
          varMetadata: {
            name: "PATH",
          },
        },
        {
          type: "none",
          text: "/123",
        },
      ]
    ],
    [
      "https://example.com/${PATH}",
      [
        {
          type: "none",
          text: "https://example.com/",
        },
        {
          type: "var",
          text: "${PATH}",
          varMetadata: {
            name: "PATH",
          },
        },
      ]
    ],
    [
      "https://example.com/$PATH/123/$SUBPATH",
      [
        {
          type: "none",
          text: "https://example.com/",
        },
        {
          type: "var",
          text: "$PATH",
          varMetadata: {
            name: "PATH",
          },
        },
        {
          type: "none",
          text: "/123/",
        },
        {
          type: "var",
          text: "$SUBPATH",
          varMetadata: {
            name: "SUBPATH",
          },
        },
      ]
    ],
    [
      "$a$b$c",
      [
        {
          type: "var",
          text: "$a",
          varMetadata: {
            name: "a",
          },
        },
        {
          type: "var",
          text: "$b",
          varMetadata: {
            name: "b",
          },
        },
        {
          type: "var",
          text: "$c",
          varMetadata: {
            name: "c",
          },
        },
      ]
    ],
    [
      "$$VAR$",
      [
        {
          type: "none",
          text: "$",
        },
        {
          type: "var",
          text: "$VAR",
          varMetadata: {
            name: "VAR",
          },
        },
        {
          type: "none",
          text: "$",
        },
      ]
    ],
    [
      "$!abc123",
      [
        {
          type: "none",
          text: "$!abc123",
        },
      ]
    ],
  ])('should parse text nodes when text=%s', (text, expectedTextNodes) => {
    const textNodes = parseTextNodes(text);
    expect(textNodes).toStrictEqual(expectedTextNodes);
  });
});
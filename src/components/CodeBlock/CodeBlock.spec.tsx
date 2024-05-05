import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import CodeBlock from ".";

describe('test CodeBlock', () => {
  it('renders', () => {
    const { container } = render(
      <CodeBlock
        code={`{"key": "value"}`}
        language="json"
      />
    );

    expect(container).not.toBeNull();
  });

  it('renders copy to clipboard when copy is enabled', () => {
    const { container } = render(
      <CodeBlock
        code={`{"key": "value"}`}
        language="json"
        copyEnabled
      />
    );

    const wrapper = createWrapper(container);

    expect(wrapper.findCopyToClipboard()).toBeTruthy();
  });
})
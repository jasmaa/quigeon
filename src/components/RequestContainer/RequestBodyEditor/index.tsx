import { useState } from "react";
import ace from "ace-builds";
import { CodeEditor, CodeEditorProps } from "@cloudscape-design/components";
import { RequestDisplay, RequestHeader } from "@quigeon/interfaces";

function getLanguage(headers: RequestHeader[]) {
  const header = headers.find(
    (header) => header.key.toLowerCase() === "content-type",
  );
  if (!header) {
    return "text";
  } else {
    switch (header.value.toLowerCase()) {
      case "application/json":
        return "json";
      case "application/xml":
        return "xml";
      default:
        return "text";
    }
  }
}

export default function RequestBodyEditor({
  requestDisplay,
  onChangeRequestDisplay,
}: {
  requestDisplay: RequestDisplay;
  onChangeRequestDisplay: (
    updatedRequestDisplay: RequestDisplay,
  ) => Promise<void>;
}) {
  const { request } = requestDisplay;
  const { body, headers } = request;

  const [preferences, setPreferences] = useState<CodeEditorProps.Preferences>();

  const codeEditorI18nStrings: CodeEditorProps.I18nStrings = {
    loadingState: "Loading code editor",
    errorState: "There was an error loading the code editor.",
    errorStateRecovery: "Retry",
    editorGroupAriaLabel: "Code editor",
    statusBarGroupAriaLabel: "Status bar",
    cursorPosition: (row, column) => `Ln ${row}, Col ${column}`,
    errorsTab: "Errors",
    warningsTab: "Warnings",
    preferencesButtonAriaLabel: "Preferences",
    paneCloseButtonAriaLabel: "Close",
    preferencesModalHeader: "Preferences",
    preferencesModalCancel: "Cancel",
    preferencesModalConfirm: "Confirm",
    preferencesModalWrapLines: "Wrap lines",
    preferencesModalTheme: "Theme",
    preferencesModalLightThemes: "Light themes",
    preferencesModalDarkThemes: "Dark themes",
  };

  const codeEditorThemes: CodeEditorProps.AvailableThemes = {
    light: ["tomorrow_night_bright"],
    dark: ["dawn"],
  };

  const language = getLanguage(headers) || "text";

  return (
    <CodeEditor
      ace={ace}
      preferences={preferences}
      onPreferencesChange={(e) => {
        setPreferences(e.detail);
      }}
      language={language}
      value={body}
      onDelayedChange={({ detail }) => {
        const updatedRequestDisplay = structuredClone(requestDisplay);
        updatedRequestDisplay.request.body = detail.value;
        onChangeRequestDisplay(updatedRequestDisplay);
      }}
      i18nStrings={codeEditorI18nStrings}
      themes={codeEditorThemes}
    />
  );
}

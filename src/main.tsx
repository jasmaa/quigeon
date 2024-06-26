import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "highlight.js/styles/default.css";
import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/css/ace.css";
import "ace-builds/css/theme/dawn.css";
import "ace-builds/css/theme/tomorrow_night_bright.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from "react";
import { AppProps } from "next/app";
import "highlight.js/styles/default.css";
import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/css/ace.css";
import "ace-builds/css/theme/dawn.css";
import "ace-builds/css/theme/tomorrow_night_bright.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

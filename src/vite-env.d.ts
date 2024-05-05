/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_ENCRYPTION_KEY_SECRETS: string;
  readonly VITE_PUBLIC_CURRENT_ENCRYPTION_KEY_VERSION: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

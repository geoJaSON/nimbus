/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OU/NSSL mPING API token — feed is disabled when unset. */
  readonly VITE_MPING_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

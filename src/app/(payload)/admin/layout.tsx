import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { importMap } from "./importMap";
import config from "@payload-config";
import type { ServerFunctionClient } from "payload";
import React from "react";

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}

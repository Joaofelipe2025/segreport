import { RootLayout } from "@payloadcms/next/layouts";
import { importMap } from "./importMap";
import config from "@payload-config";
import React from "react";

type Args = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap}>
      {children}
    </RootLayout>
  );
}

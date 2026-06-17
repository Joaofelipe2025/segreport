import { RootLayout } from "@payloadcms/next/layouts"
import { importMap } from "./importMap"
import { serverFunction } from "./_serverAction"
import config from "@payload-config"
import React from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

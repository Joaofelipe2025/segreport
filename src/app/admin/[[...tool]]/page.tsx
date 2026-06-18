"use client";

import { NextStudio } from "next-sanity/studio";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require("../../../sanity.config").default;

export default function AdminPage() {
  return <NextStudio config={config} />;
}

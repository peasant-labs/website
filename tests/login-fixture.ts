import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

export type LoginFixture = {
  version: 1;
  dialog: { title: string; github: string; terminal: string; privacy: { label: string; href: string } };
  online: string;
  next: Array<{ name: string; address: string; start: string }>;
  required: string[];
};

/** testdata/login/login.yaml, the log-in dialog's independent oracle */
export function loadLoginFixture(): LoginFixture {
  const root = parse(readFileSync(resolve("testdata/login/login.yaml"), "utf8")) as LoginFixture;
  if (root?.version !== 1) {
    throw new Error("testdata/login/login.yaml: expected version 1; update the loader with the fixture.");
  }
  const names = new Set(root.next.map((entry) => entry.name));
  for (const name of root.required) {
    if (!names.has(name)) throw new Error(`testdata/login/login.yaml: the required case "${name}" is missing.`);
  }
  return root;
}

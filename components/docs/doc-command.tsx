import { CommandBlock } from "@/components/fairtrade-client";

/**
 * A copyable command, wrapped: fairtrade's CommandBlock breaks it at spaces and
 * after an address's slashes, keeps a hyphenated word whole and a pipe with the
 * word after it, and breaks inside a piece only when it alone is wider than the
 * line. Nothing scrolls out of sight, and copy takes the exact command.
 */
export function DocCommand({ command, label }: { command: string; label?: string }) {
  return (
    <div className="dx-cmd">
      <CommandBlock command={command} label={label ?? command} wrap />
    </div>
  );
}

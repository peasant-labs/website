import { CommandBlock } from "@/components/fairtrade-client";

/**
 * A copyable command, wrapped: fairtrade breaks it only at spaces, so a flag,
 * a date or a package name stays whole, and only a token wider than the line
 * (an address on a phone) breaks inside it. Nothing scrolls out of sight.
 */
export function DocCommand({ command, label }: { command: string; label?: string }) {
  return (
    <div className="dx-cmd">
      <CommandBlock command={command} label={label ?? command} wrap />
    </div>
  );
}

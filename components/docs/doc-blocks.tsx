import {
  DocCaptionedCommand,
  DocCommands,
  DocList,
  DocNote,
  DocPath,
  DocProcedure,
} from "@/components/docs/doc-parts";
import { Rich } from "@/components/docs/rich-text";
import type { DocBlock } from "@/lib/docs-guides";
import { Fragment } from "react";

/** One guide step's body, drawn from its blocks in order. */
export function DocBlocks({ blocks }: { blocks: readonly DocBlock[] }) {
  return blocks.map((block, index) => {
    if ("p" in block) {
      return (
        <p key={index}>
          <Rich text={block.p} />
        </p>
      );
    }
    if ("ol" in block) return <DocList key={index} items={block.ol} ordered />;
    if ("ul" in block) return <DocList key={index} items={block.ul} />;
    if ("cmds" in block) return <DocCommands key={index} commands={block.cmds} />;
    if ("captioned" in block) {
      return (
        <Fragment key={index}>
          {block.captioned.map((item) => (
            <DocCaptionedCommand key={item.command} caption={item.caption} command={item.command} />
          ))}
        </Fragment>
      );
    }
    if ("options" in block) return <DocProcedure key={index} steps={block.options} ordered={false} />;
    if ("note" in block) {
      return (
        <DocNote key={index}>
          <Rich text={block.note} />
        </DocNote>
      );
    }
    return <DocPath key={index} path={block.path} />;
  });
}

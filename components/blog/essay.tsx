import { Rich } from "@/components/docs/rich-text";
import { type Essay, type EssayList, NOTES, noteId, noteRefId } from "@/lib/essay";
import Image from "next/image";
import { Fragment, type ReactNode } from "react";

/*
 * An essay's own marks, split out before the docs' marks are drawn: a written
 * bracket, a reference to a note, and *emphasis* (which may hold a link). The
 * emphasis pattern skips the stars of **strong**.
 */
const MARKS = /(\\[[\]]|\[\^\d+\]|(?<![*\w])\*(?![*\s])[^*]+?(?<![*\s])\*(?![*\w]))/;
const NOTE_REF = /^\[\^(\d+)\]$/;

/** a line of an essay, its marks drawn and everything else kept as text */
export function EssayText({ text }: { text: string }) {
  const parts = text.split(MARKS);
  const out: ReactNode[] = [];
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]!;
    if (index % 2 === 0) {
      if (part) out.push(<Rich key={index} text={part} />);
      continue;
    }
    const note = NOTE_REF.exec(part);
    if (part.startsWith("\\")) out.push(part.slice(1));
    else if (note) {
      const n = Number(note[1]);
      out.push(
        <sup key={index} className="bx-note-ref">
          <a id={noteRefId(n)} href={`#${noteId(n)}`} aria-label={`note ${n}`}>
            {n}
          </a>
        </sup>,
      );
    } else
      out.push(
        <em key={index}>
          <Rich text={part.slice(1, -1)} />
        </em>,
      );
  }
  return <>{out}</>;
}

function List({ list }: { list: EssayList }) {
  const Tag = list.ordered ? "ol" : "ul";
  return (
    <Tag className="bx-list">
      {list.items.map((item, index) => (
        <li key={index}>
          {item.text.map((line, at) => (
            <Fragment key={at}>
              {at > 0 ? " " : null}
              <EssayText text={line} />
            </Fragment>
          ))}
          {item.list ? <List list={item.list} /> : null}
        </li>
      ))}
    </Tag>
  );
}

/** an essay's body: its blocks in order, then its numbered notes, each linked both ways with its reference */
export function EssayBody({ essay }: { essay: Essay }) {
  return (
    <>
      {essay.blocks.map((block, index) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2 key={index} id={block.id}>
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} id={block.id}>
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={index}>
                <EssayText text={block.text} />
              </p>
            );
          case "list":
            return <List key={index} list={block} />;
          case "figure":
            return (
              <figure key={index} className="bx-essay-figure">
                <Image src={block.src} alt={block.alt} width={block.width} height={block.height} unoptimized />
                {block.caption ? (
                  <figcaption>
                    <EssayText text={block.caption} />
                  </figcaption>
                ) : null}
              </figure>
            );
        }
      })}
      {essay.notes.length > 0 ? (
        <>
          <h2 id={NOTES.id}>{NOTES.title}</h2>
          <ol className="bx-notes">
            {essay.notes.map((note) => (
              <li key={note.n} id={noteId(note.n)}>
                {note.text.map((line, at) => (
                  <p key={at}>
                    <EssayText text={line} />
                  </p>
                ))}
                <a className="bx-note-back" href={`#${noteRefId(note.n)}`} aria-label={`back to note ${note.n} in the text`}>
                  back
                </a>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </>
  );
}

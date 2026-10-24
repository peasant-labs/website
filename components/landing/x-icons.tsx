import type { SVGProps } from "react";

/*
 * The marks of the X thread, drawn as X draws its own: thin line icons on a
 * 24-unit grid in the text's colour. They are decoration; every one is hidden
 * from assistive technology. The logo is a P of our own in the manner of X's
 * mark, one thick stroke and one thin, never X's mark itself.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Line({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** the site's logo in the thread: a bold geometric P, a heavy stem and a thin bowl */
export function PLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M4 2h5.2v20H4z" />
      <path
        fillRule="evenodd"
        d="M9.2 2h4.8a6.2 6.2 0 0 1 0 12.4H9.2v-1.7h4.8a4.5 4.5 0 0 0 0-9H9.2z"
      />
    </svg>
  );
}

export function ReplyIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M9.5 4.5h5a6.5 6.5 0 0 1 0 13H13l-4.5 3.5v-3.6A6.5 6.5 0 0 1 9.5 4.5z" />
    </Line>
  );
}

/* two arrows chasing each other round, set well apart: the upper runs right, the lower runs left */
export function RepostIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M4.5 11.5V7.5a2.5 2.5 0 0 1 2.5-2.5h11" />
      <path d="M15.5 2l3 3-3 3" />
      <path d="M19.5 12.5v4a2.5 2.5 0 0 1-2.5 2.5H6" />
      <path d="M8.5 22l-3-3 3-3" />
    </Line>
  );
}

export function LikeIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 20.5s-8.5-4.9-8.5-11A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.5 2.6c0 6.1-8.5 11-8.5 11z" />
    </Line>
  );
}

/* the views count: four bars of uneven height */
export function ViewsIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M5 20.5v-8" />
      <path d="M10 20.5v-17" />
      <path d="M14.5 20.5v-6" />
      <path d="M19 20.5v-11.5" />
    </Line>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />
    </Line>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 15V3.5" />
      <path d="M7.5 8L12 3.5 16.5 8" />
      <path d="M4.5 14v4.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14" />
    </Line>
  );
}

/* the more menu at a post's top right: three dots in a row */
export function MoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

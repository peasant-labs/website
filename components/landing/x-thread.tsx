"use client";

import {
  BookmarkIcon,
  LikeIcon,
  MoreIcon,
  PLogo,
  ReplyIcon,
  RepostIcon,
  ShareIcon,
  ViewsIcon,
} from "@/components/landing/x-icons";
import { SafariWindow } from "@/components/mac";
import { THREAD } from "@/lib/landing";
import { SAMPLE_CARD as CARD } from "@/lib/sample-session";
import { ShareCard, shareCardAlt } from "@peasant-labs/fairtrade/share";
import type { CSSProperties, ReactNode } from "react";

type Post = (typeof THREAD.posts)[number];

/*
 * The link's card as X shows it: fairtrade's share card drawn at its own 1200
 * pixels and scaled to the post's width, in X's rounded media frame. The
 * scale is the frame's width in CSS, so it is right before any script runs.
 * The card lays out each word on its own, so it is read as one image named
 * by its alt.
 */
function Card() {
  return (
    <div className="lp-x-card" role="img" aria-label={shareCardAlt(CARD)}>
      <div className="lp-x-card-scale" aria-hidden="true">
        <ShareCard card={CARD} />
      </div>
    </div>
  );
}

/* the first post's picture: a chart of the sample's pass rates, as a quick plot would draw it */
function Chart() {
  const { title, bars } = THREAD.chart;
  const label = `bar chart, ${title}: ${bars.map((bar) => `${bar.label} ${bar.value}%`).join(", ")}`;
  return (
    <div className="lp-x-media lp-x-chart" role="img" aria-label={label}>
      <div className="lp-x-chart-title">{title}</div>
      <div className="lp-x-bars">
        {bars.map((bar) => (
          <div key={bar.label} className="lp-x-bar">
            <div className="lp-x-bar-plot">
              <span className="lp-x-bar-value">{bar.value}%</span>
              <span className="lp-x-bar-fill" style={{ "--lp-x-bar": `${bar.value}%` } as CSSProperties} />
            </div>
            <span className="lp-x-bar-label">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Action({ name, icon, count }: { name: string; icon: ReactNode; count?: string }) {
  return (
    <span className="lp-x-action" data-action={name}>
      {icon}
      {count ? <span className="lp-x-count">{count}</span> : null}
    </span>
  );
}

function PostView({ post, linked, children }: { post: Post; linked: boolean; children?: ReactNode }) {
  return (
    <div className="lp-x-post" data-linked={linked ? "true" : undefined}>
      <div className="lp-x-gutter" aria-hidden="true">
        <span className={`lp-x-avatar lp-x-avatar-${post.name}`} />
        {linked ? <span className="lp-x-line" /> : null}
      </div>
      <div className="lp-x-main">
        <div className="lp-x-head">
          <span className="lp-x-name">{post.name}</span>
          <span className="lp-x-handle">{post.handle}</span>
          <span className="lp-x-pause">, </span>
          <span className="lp-x-sep" aria-hidden="true">
            ·
          </span>
          <span className="lp-x-time">{post.time}</span>
          <span className="lp-x-more" aria-hidden="true">
            <MoreIcon />
          </span>
        </div>
        {post.text ? <div className="lp-x-text">{post.text}</div> : null}
        {children}
        <div className="lp-x-actions" aria-hidden="true">
          <Action name="reply" icon={<ReplyIcon />} count={post.counts.reply} />
          <Action name="repost" icon={<RepostIcon />} count={post.counts.repost} />
          <Action name="like" icon={<LikeIcon />} count={post.counts.like} />
          <Action name="views" icon={<ViewsIcon />} count={post.counts.views} />
          <span className="lp-x-action-end">
            <Action name="bookmark" icon={<BookmarkIcon />} />
            <Action name="share" icon={<ShareIcon />} />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * mira's thread on X, in a Safari window: her benchmark of the sample's models
 * with its chart, a reply asking for the prompt, and her answer, which is only
 * the transcript's link card and the line naming where it links. It looks
 * as X does, in X's dark appearance whatever the site's theme, starting
 * straight at the posts with no top bar so the thread has the room; the
 * window's tab shows our P, never X's mark. It is read once, as a short group.
 *
 * Without `chrome`, the thread stands alone, with no window around it, as a
 * phone shows it under the session's slice.
 */
export function XThread({ className, chrome = true }: { className?: string; chrome?: boolean }) {
  const [benchmark, question, answer] = THREAD.posts;
  const thread = (
    <div
      className={chrome || !className ? "lp-x" : `lp-x ${className}`}
      data-x-thread
      role="group"
      aria-label={THREAD.label}
    >
      <PostView post={benchmark} linked>
        <Chart />
      </PostView>
      <PostView post={question} linked />
      <PostView post={answer} linked={false}>
        <Card />
        <div className="lp-x-from">{THREAD.from}</div>
      </PostView>
    </div>
  );
  if (!chrome) return thread;
  return (
    <SafariWindow className={`lp-x-win${className ? ` ${className}` : ""}`} favicon={<PLogo />}>
      {thread}
    </SafariWindow>
  );
}

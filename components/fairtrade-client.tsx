"use client";

// @peasant-labs/fairtrade ships client-only components without a "use client"
// directive in dist, so its /ui entry cannot be imported from a Server
// Component. Re-export through this boundary instead.
export {
  Accordion,
  AppSidebarLayout,
  BrandMark,
  Breadcrumb,
  Button,
  Card,
  CardImg,
  CliSteps,
  CommandBlock,
  EmptyState,
  ConsentDialog,
  ConsentSummary,
  DangerZone,
  Dialog,
  MetaItem,
  SignInProviders,
  StepIndicator,
  Tabs,
} from "@peasant-labs/fairtrade/ui";

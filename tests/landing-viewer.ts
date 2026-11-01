import { expect, type Locator } from "@playwright/test";

/** Open the native filters offered by the mounted viewer, including compact embeds. */
export async function openViewerFilters(viewer: Locator) {
  const tools = viewer.getByRole("button", { name: "transcript tools", exact: true });
  if (await tools.count()) {
    await expect(tools).toBeVisible();
    await tools.click();
    await viewer.locator(".txn-mobile-controls").getByRole("button", { name: "filters", exact: true }).click();
    const panel = viewer.getByRole("dialog", { name: "filters", exact: true });
    await expect(panel).toBeVisible();
    return {
      mode: "drawer" as const,
      panel,
      body: panel.locator(".txn-mobile-drawer-body"),
      close: async () => {
        await panel.getByRole("button", { name: "close drawer", exact: true }).click();
        await expect(panel).not.toBeVisible();
        await expect(tools).toBeFocused();
      },
    };
  }

  await viewer.getByRole("button", { name: "expand filters", exact: true }).click();
  const panel = viewer.getByRole("complementary", { name: "filters", exact: true });
  await expect(panel).toBeVisible();
  return {
    mode: "rail" as const,
    panel,
    body: panel.locator(".txn-rail-body"),
    close: async () => {
      await panel.getByRole("button", { name: "collapse filters", exact: true }).click();
      await expect(viewer.locator(".txn-body-grid")).toHaveAttribute("data-right-rail", "closed");
    },
  };
}

type Itemish = { href: string; exact?: boolean };

export function isItemActive(pathname: string, item: Itemish): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function isGroupActive(pathname: string, group: { items: Itemish[] }): boolean {
  return group.items.some((it) => isItemActive(pathname, it));
}

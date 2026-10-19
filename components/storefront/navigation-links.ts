export const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function isNavigationLinkActive(href: string, pathname: string) {
  if (href === "/#categories") {
    return pathname.startsWith("/categories");
  }
  if (href === "/products") {
    return pathname === "/products" || pathname.startsWith("/products/");
  }
  return pathname === href;
}

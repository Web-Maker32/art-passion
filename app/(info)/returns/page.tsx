import { permanentRedirect } from "next/navigation";

// Kept so existing links and search results still resolve.
export default function ReturnsRedirect() {
  permanentRedirect("/shipping-and-returns");
}

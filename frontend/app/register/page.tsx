import { redirect } from "next/navigation";

// /login and /register have been merged into one route (per explicit
// request) — the mode toggle + card-flip UI now lives entirely in
// app/login/page.tsx. This route is kept only so old links/bookmarks to
// /register still land somewhere sensible: redirect straight to the
// register mode of the merged page.
export default function RegisterPage() {
  redirect("/login?mode=register");
}

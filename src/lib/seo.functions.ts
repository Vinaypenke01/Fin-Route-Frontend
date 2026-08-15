export async function getRequestOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://fin-route.site";
}

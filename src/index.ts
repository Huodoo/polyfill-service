import { Elysia } from "elysia";
import { getPolyfillString } from "polyfill-library";
import { createCache } from "cache-manager";
const cache = createCache();
const app = new Elysia()
  .onError(({ set }) => {
    set.status = "OK";
    return "/*error*/";
  })
  .get("/*", async ({ path, headers, set, query }) => {
    set.headers["content-type"] = "text/javascript";
    if (!["/polyfill.js", "/polyfill.min.js"].includes(path)) {
      return "/*only /polyfill.js /polyfill.min.js is avaliable*/";
    }
    const uaString = headers["user-agent"];
    if (!uaString) {
      return "/*no user agent provided*/";
    }
    const cacheKey = path + uaString;
    const polyfillStr = await cache.get(cacheKey);
    if (polyfillStr) {
      return polyfillStr;
    } else {
      const dft = {
        flags: ["gated" as const],
      };
      const features = Object.fromEntries(
        (query.features?.split(",") || ["default"]).map((f) => [f, dft])
      );
      const polyfill = await getPolyfillString({
        minify: path === "/polyfill.min.js",
        uaString,
        features,
      });
      cache.set(cacheKey, polyfill);
      return polyfill;
    }
  })

  .listen(3000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
/// polyfill.min.js?features=default%2Ces2016%2Ces2017%2Ces2018%2Ces2019%2Ces2020%2Ces2021%2Ces2022%2Ces2023%2Ces2024%2CAbortController%2CResizeObserver%2CglobalThis%2Csmoothscroll%2CEventSource

export function getPathUrl(pathname) {
  let accumulatedPath = '';

  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      accumulatedPath += `/${segment}`;
      return {
        name: segment,
        url: accumulatedPath,
        isDynamicSegment: /^\d+$/.test(segment), // You can extend to match UUIDs
      };
    });
}
export const getBrowser = (userAgent: string): string => {
  const browserRegex =
    /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i;
  const match = userAgent.match(browserRegex);
  return match ? match[1].toLowerCase() : 'unknown';
};

export const getOS = (userAgent: string): string => {
  const osRegex =
    /(windows nt|mac os x|linux|android|ios|iPhone|iphone|iPad|ipad)\s*([\d._]+)/i;
  const match = userAgent.toLowerCase().match(osRegex);
  return match ? match[1].toLowerCase() : 'unknown';
};

export const getDevice = (userAgent: string): string => {
  const deviceRegex =
    /(iphone|ipad|ipod|android|windows phone|blackberry|nokia|samsung|googlebot)/i;
  const match = userAgent.toLowerCase().match(deviceRegex);
  return match ? match[1].toLowerCase() : 'desktop';
};

export const parseUserAgent = (
  userAgent: string,
): {
  browser: string;
  os: string;
  device: string;
} => {
  return {
    browser: getBrowser(userAgent),
    os: getOS(userAgent),
    device: getDevice(userAgent),
  };
};

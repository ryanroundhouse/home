const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

export function shouldUseTestDonationLink(locationLike) {
  const protocol = String(locationLike?.protocol || '').toLowerCase();
  const hostname = String(locationLike?.hostname || '').toLowerCase();

  return protocol === 'file:' || DEV_HOSTNAMES.has(hostname);
}

export function resolveDonationLink({ liveUrl, testUrl, locationLike }) {
  if (shouldUseTestDonationLink(locationLike) && testUrl) {
    return testUrl;
  }

  return liveUrl;
}

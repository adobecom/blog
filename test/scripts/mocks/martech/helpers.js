// Stand-in for milo's libs/martech/helpers.js, only exporting the one function
// persistRegionFromPath() depends on. Tests control the return value via setMockConsent.
let consentConfig = { functional: true };

export function getMepConsentConfig() {
  return consentConfig;
}

export function setMockConsent(config) {
  consentConfig = config;
}

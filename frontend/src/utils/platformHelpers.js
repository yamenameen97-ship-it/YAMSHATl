export function buildDarkThemes() {
  return ['dark', 'amoled', 'midnight'];
}

export function buildOnboardingSteps() {
  return [
    'welcome',
    'profile_setup',
    'follow_users',
    'explore_content',
  ];
}

export function buildConsentState(enabled = false) {
  return {
    consent: enabled,
  };
}

export function buildAccessibilityConfig() {
  return {
    reducedMotion: true,
    screenReader: true,
    contrastMode: true,
  };
}
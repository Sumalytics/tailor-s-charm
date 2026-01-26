// Utility functions for authentication debugging and compatibility

export const checkBrowserCompatibility = () => {
  const issues = [];
  
  // Check for popup blockers
  const popupBlocked = checkPopupBlocker();
  if (popupBlocked) {
    issues.push('Popup blocker detected');
  }
  
  // Check for third-party cookie restrictions
  const cookieRestricted = checkCookieRestrictions();
  if (cookieRestricted) {
    issues.push('Third-party cookies may be restricted');
  }
  
  // Check browser compatibility
  const compatibleBrowser = checkBrowserSupport();
  if (!compatibleBrowser) {
    issues.push('Browser may not be fully compatible');
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    recommendations: getRecommendations(issues)
  };
};

const checkPopupBlocker = (): boolean => {
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
};

const checkCookieRestrictions = (): boolean => {
  // Simple check for cookie support
  try {
    document.cookie = 'testcookie=1';
    const ret = document.cookie.indexOf('testcookie=') !== -1;
    document.cookie = 'testcookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return !ret;
  } catch (e) {
    return true;
  }
};

const checkBrowserSupport = (): boolean => {
  const userAgent = navigator.userAgent;
  
  // Check for supported browsers
  const supportedBrowsers = [
    'Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'
  ];
  
  return supportedBrowsers.some(browser => 
    userAgent.includes(browser)
  );
};

const getRecommendations = (issues: string[]): string[] => {
  const recommendations = [];
  
  if (issues.includes('Popup blocker detected')) {
    recommendations.push('Disable popup blocker for this site or allow pop-ups from this domain');
  }
  
  if (issues.includes('Third-party cookies may be restricted')) {
    recommendations.push('Allow third-party cookies in your browser settings');
  }
  
  if (issues.includes('Browser may not be fully compatible')) {
    recommendations.push('Try using a modern browser like Chrome, Firefox, Safari, or Edge');
  }
  
  return recommendations;
};

export const detectAuthIssue = (error: any): string => {
  if (!error) return 'Unknown error';
  
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Network-related issues
  if (errorCode === 'auth/network-request-failed' || 
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch')) {
    return 'network';
  }
  
  // User cancellation
  if (errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request') {
    return 'user_cancelled';
  }
  
  // Popup blocked
  if (errorCode === 'auth/popup-blocked') {
    return 'popup_blocked';
  }
  
  // Configuration issues
  if (errorMessage.includes('configuration') ||
      errorMessage.includes('invalid-api-key') ||
      errorMessage.includes('project-not-found')) {
    return 'configuration';
  }
  
  // Rate limiting
  if (errorCode === 'auth/too-many-requests') {
    return 'rate_limit';
  }
  
  return 'unknown';
};

export const getAuthErrorMessage = (issueType: string, originalError?: any): string => {
  switch (issueType) {
    case 'network':
      return 'Network connection failed. Please check your internet connection and try again.';
    
    case 'user_cancelled':
      return 'Sign-in was cancelled. You can try again if you change your mind.';
    
    case 'popup_blocked':
      return 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
    
    case 'configuration':
      return 'Authentication service is not properly configured. Please contact support.';
    
    case 'rate_limit':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    
    default:
      return originalError?.message || 'An unexpected error occurred during sign-in.';
  }
};

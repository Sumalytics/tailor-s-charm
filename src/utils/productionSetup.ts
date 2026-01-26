// Environment variables validation
export const validateEnvironmentVariables = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_PAYSTACK_PUBLIC_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  return true;
};

// Environment-specific configurations
export const config = {
  development: {
    apiUrl: 'http://localhost:8080',
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    paystack: {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    },
    enableDebugMode: true,
    enableConsoleLogging: true,
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.tailorflow.com',
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    paystack: {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    },
    enableDebugMode: false,
    enableConsoleLogging: false,
  },
};

export const currentConfig = config[import.meta.env.MODE as keyof typeof config] || config.development;

// Error monitoring utilities
export class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private errors: Array<{
    error: Error;
    timestamp: Date;
    userAgent: string;
    url: string;
    userId?: string;
    shopId?: string;
  }> = [];

  static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  logError(error: Error, context?: { userId?: string; shopId?: string }) {
    const errorData = {
      error,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    this.errors.push(errorData);

    // In production, send to error monitoring service
    if (import.meta.env.PROD) {
      this.sendToMonitoringService(errorData);
    } else {
      console.error('Error logged:', errorData);
    }

    // Keep only last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  private async sendToMonitoringService(errorData: any) {
    // Integration with error monitoring service (Sentry, LogRocket, etc.)
    try {
      // Example: await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });
      console.log('Error sent to monitoring service:', errorData);
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

// Performance monitoring utilities
export class PerformanceMonitoring {
  private static instance: PerformanceMonitoring;
  private metrics: Array<{
    name: string;
    value: number;
    timestamp: Date;
    type: 'navigation' | 'resource' | 'paint' | 'interaction';
  }> = [];

  static getInstance(): PerformanceMonitoring {
    if (!PerformanceMonitoring.instance) {
      PerformanceMonitoring.instance = new PerformanceMonitoring();
    }
    return PerformanceMonitoring.instance;
  }

  startTiming(name: string) {
    performance.mark(`${name}-start`);
  }

  endTiming(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      this.recordMetric(name, measure.duration, 'interaction');
    }
  }

  recordMetric(name: string, value: number, type: 'navigation' | 'resource' | 'paint' | 'interaction') {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      type
    });

    // Keep only last 200 metrics in memory
    if (this.metrics.length > 200) {
      this.metrics = this.metrics.slice(-200);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageMetric(name: string) {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  // Core Web Vitals
  measureCoreWebVitals() {
    if ('web-vitals' in window) {
      // This would require installing the web-vitals library
      // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
      
      // getCLS(console.log);
      // getFID(console.log);
      // getFCP(console.log);
      // getLCP(console.log);
      // getTTFB(console.log);
    }
  }
}

// A/B Testing Framework
export class ABTesting {
  private static instance: ABTesting;
  private tests: Map<string, {
    name: string;
    variants: string[];
    weights: number[];
    userAssignments: Map<string, string>;
  }> = new Map();

  static getInstance(): ABTesting {
    if (!ABTesting.instance) {
      ABTesting.instance = new ABTesting();
    }
    return ABTesting.instance;
  }

  defineTest(name: string, variants: string[], weights: number[] = []) {
    if (weights.length === 0) {
      weights = variants.map(() => 1 / variants.length);
    }

    this.tests.set(name, {
      name,
      variants,
      weights,
      userAssignments: new Map()
    });
  }

  getVariant(name: string, userId?: string): string {
    const test = this.tests.get(name);
    if (!test) return 'control';

    const key = userId || 'anonymous';
    
    // Check if user is already assigned
    if (test.userAssignments.has(key)) {
      return test.userAssignments.get(key)!;
    }

    // Assign user to a variant
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < test.variants.length; i++) {
      cumulative += test.weights[i];
      if (random <= cumulative) {
        test.userAssignments.set(key, test.variants[i]);
        return test.variants[i];
      }
    }

    return test.variants[0]; // Fallback
  }

  trackConversion(testName: string, userId?: string) {
    const variant = this.getVariant(testName, userId);
    
    // Send conversion data to analytics
    console.log('Conversion tracked:', {
      test: testName,
      variant,
      userId,
      timestamp: new Date()
    });
  }

  getTestStats(name: string) {
    const test = this.tests.get(name);
    if (!test) return null;

    const stats: Record<string, number> = {};
    test.userAssignments.forEach(variant => {
      stats[variant] = (stats[variant] || 0) + 1;
    });

    return {
      name: test.name,
      variants: test.variants,
      assignments: stats,
      totalAssignments: test.userAssignments.size
    };
  }
}

// Service Worker for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Bundle analysis utilities
export const analyzeBundle = () => {
  if (import.meta.env.DEV) {
    console.log('Bundle Analysis:');
    console.log('Mode:', import.meta.env.MODE);
    console.log('Base URL:', import.meta.env.BASE_URL);
    
    // Log chunk information if available
    if (window.__webpack_manifest__) {
      console.log('Webpack chunks:', window.__webpack_manifest__);
    }
  }
};

// Health check utilities
export const performHealthCheck = async () => {
  const health = {
    timestamp: new Date(),
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    checks: {
      firebase: false,
      network: false,
      storage: false,
      performance: false
    }
  };

  try {
    // Check Firebase connectivity
    const response = await fetch('https://firebase.googleapis.com/');
    health.checks.firebase = response.ok;

    // Check network connectivity
    health.checks.network = navigator.onLine;

    // Check localStorage availability
    try {
      localStorage.setItem('health-check', 'test');
      localStorage.removeItem('health-check');
      health.checks.storage = true;
    } catch {
      health.checks.storage = false;
    }

    // Check performance (simple check)
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const end = performance.now();
    health.checks.performance = (end - start) < 200;

    // Determine overall status
    const failedChecks = Object.values(health.checks).filter(check => !check).length;
    if (failedChecks === 0) {
      health.status = 'healthy';
    } else if (failedChecks <= 2) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

  } catch (error) {
    health.status = 'unhealthy';
    console.error('Health check failed:', error);
  }

  return health;
};

// Initialize production setup
export const initializeProductionSetup = async () => {
  // Validate environment variables
  validateEnvironmentVariables();

  // Initialize error monitoring
  const errorMonitoring = ErrorMonitoring.getInstance();
  
  // Initialize performance monitoring
  const performanceMonitoring = PerformanceMonitoring.getInstance();
  
  // Initialize A/B testing
  const abTesting = ABTesting.getInstance();

  // Register service worker in production
  if (import.meta.env.PROD) {
    await registerServiceWorker();
  }

  // Perform health check
  const health = await performHealthCheck();
  console.log('Health check result:', health);

  // Analyze bundle in development
  if (import.meta.env.DEV) {
    analyzeBundle();
  }

  // Set up global error handlers
  window.addEventListener('error', (event) => {
    errorMonitoring.logError(event.error || new Error(event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorMonitoring.logError(new Error(event.reason));
  });

  return {
    errorMonitoring,
    performanceMonitoring,
    abTesting,
    health
  };
};

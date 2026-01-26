// Performance optimization utilities

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  cached: boolean;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  };

  constructor() {
    this.initializePerformanceTracking();
    this.optimizeImages();
    this.optimizeFonts();
    this.setupServiceWorker();
  }

  // Initialize performance tracking
  private initializePerformanceTracking() {
    if ('PerformanceObserver' in window) {
      // Track First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Track Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const perfEntry = entry as any;
          this.metrics.fid = perfEntry.processingStart - perfEntry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.metrics.cls += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Track Time to First Byte
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          }
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  // Optimize images
  private optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="lazy" to images below the fold
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add error handling
      img.addEventListener('error', () => {
        img.style.display = 'none';
      });

      // Optimize image sizes
      if (img.naturalWidth > 1920) {
        img.style.maxWidth = '1920px';
        img.style.height = 'auto';
      }
    });
  }

  // Optimize fonts
  private optimizeFonts() {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/inter-var.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);

    // Add font display swap
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 100 900;
        font-display: swap;
        src: url('/fonts/inter-var.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  // Setup service worker for caching
  private setupServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get resource timing information
  getResourceTiming(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
    }));
  }

  // Optimize bundle loading
  static optimizeBundleLoading() {
    // Dynamic imports for code splitting
    const lazyLoadComponents = () => {
      // Example: Lazy load heavy components
      import('@/components/admin/AdminAnalytics').then(module => {
        console.log('AdminAnalytics loaded');
      });
    };

    // Preload critical routes
    const preloadRoutes = () => {
      const routes = ['/dashboard', '/customers', '/orders'];
      routes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    return {
      lazyLoadComponents,
      preloadRoutes,
    };
  }

  // Optimize database queries
  static optimizeQueries() {
    // Implement query optimization strategies
    return {
      // Pagination
      paginate: (page: number, limit: number) => ({
        skip: (page - 1) * limit,
        limit,
      }),

      // Caching
      cache: {
        set: (key: string, data: any, ttl: number = 300000) => {
          const item = {
            data,
            timestamp: Date.now(),
            ttl,
          };
          localStorage.setItem(key, JSON.stringify(item));
        },
        get: (key: string) => {
          const item = localStorage.getItem(key);
          if (!item) return null;
          
          const parsed = JSON.parse(item);
          if (Date.now() - parsed.timestamp > parsed.ttl) {
            localStorage.removeItem(key);
            return null;
          }
          
          return parsed.data;
        },
      },

      // Debouncing
      debounce: (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },
    };
  }

  // Memory optimization
  static optimizeMemory() {
    // Clean up event listeners
    const cleanup = () => {
      // Remove unused event listeners
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        const clone = element.cloneNode(true);
        element.parentNode?.replaceChild(clone, element);
      });
    };

    // Clear unused data
    const clearCache = () => {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name !== 'static-cache') {
              caches.delete(name);
            }
          });
        });
      }
    };

    return {
      cleanup,
      clearCache,
    };
  }

  // Network optimization
  static optimizeNetwork() {
    // Implement request batching
    const batchRequests = (requests: any[]) => {
      return Promise.allSettled(requests);
    };

    // Implement retry logic
    const retryRequest = async (fn: Function, retries = 3) => {
      try {
        return await fn();
      } catch (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return retryRequest(fn, retries - 1);
        }
        throw error;
      }
    };

    return {
      batchRequests,
      retryRequest,
    };
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export static methods
export const {
  optimizeBundleLoading,
  optimizeQueries,
  optimizeMemory,
  optimizeNetwork,
} = PerformanceOptimizer;

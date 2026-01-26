interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  shopId?: string;
  sessionId?: string;
}

interface UserBehavior {
  userId: string;
  shopId?: string;
  sessionId: string;
  events: AnalyticsEvent[];
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  timeSpent: number; // in seconds
  deviceInfo: {
    userAgent: string;
    screenResolution?: string;
    isMobile: boolean;
  };
}

interface BusinessMetrics {
  revenue: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    averageRevenuePerShop: number;
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    customerRetentionRate: number;
    averageLifetimeValue: number;
  };
  orders: {
    totalOrders: number;
    ordersThisMonth: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
}

class AnalyticsService {
  private sessionId: string;
  private startTime: Date;
  private events: AnalyticsEvent[] = [];
  private isProduction: boolean;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private initializeTracking() {
    // Track page views
    this.trackPageView();
    
    // Track user engagement
    this.trackEngagement();
    
    // Track errors
    this.trackErrors();
  }

  // Track custom events
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);

    if (this.isProduction) {
      this.sendToAnalytics(analyticsEvent);
    } else {
      console.log('Analytics Event:', analyticsEvent);
    }
  }

  // Track page views
  private trackPageView() {
    const observer = new MutationObserver(() => {
      this.track('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Track user engagement
  private trackEngagement() {
    let lastActivity = Date.now();
    let timeOnPage = 0;

    const updateActivity = () => {
      const now = Date.now();
      timeOnPage += now - lastActivity;
      lastActivity = now;
    };

    // Track mouse movement, clicks, scrolls
    ['mousedown', 'mousemove', 'scroll', 'keydown'].forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Track session duration
    window.addEventListener('beforeunload', () => {
      this.track('session_end', {
        duration: Date.now() - this.startTime.getTime(),
        timeOnPage,
        pageViews: this.events.filter(e => e.event === 'page_view').length,
      });
    });
  }

  // Track errors
  private trackErrors() {
    window.addEventListener('error', (event) => {
      this.track('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track('unhandled_promise_rejection', {
        reason: event.reason,
      });
    });
  }

  // Track business events
  trackUserRegistration(userId: string, properties?: Record<string, any>) {
    this.track('user_registered', {
      userId,
      ...properties,
    });
  }

  trackShopCreation(shopId: string, userId: string, properties?: Record<string, any>) {
    this.track('shop_created', {
      shopId,
      userId,
      ...properties,
    });
  }

  trackOrderCreation(orderId: string, shopId: string, properties?: Record<string, any>) {
    this.track('order_created', {
      orderId,
      shopId,
      ...properties,
    });
  }

  trackPaymentInitiation(paymentId: string, amount: number, properties?: Record<string, any>) {
    this.track('payment_initiated', {
      paymentId,
      amount,
      ...properties,
    });
  }

  trackPaymentCompletion(paymentId: string, amount: number, properties?: Record<string, any>) {
    this.track('payment_completed', {
      paymentId,
      amount,
      ...properties,
    });
  }

  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.track('feature_used', {
      feature,
      ...properties,
    });
  }

  // Calculate business metrics
  async calculateBusinessMetrics(): Promise<BusinessMetrics> {
    // This would typically fetch data from your database
    // For now, returning mock data structure
    return {
      revenue: {
        mrr: 0,
        arr: 0,
        totalRevenue: 0,
        averageRevenuePerShop: 0,
      },
      customers: {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        customerRetentionRate: 0,
        averageLifetimeValue: 0,
      },
      orders: {
        totalOrders: 0,
        ordersThisMonth: 0,
        averageOrderValue: 0,
        conversionRate: 0,
      },
      engagement: {
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
      },
    };
  }

  // Get user behavior insights
  getUserBehaviorInsights(): UserBehavior[] {
    // This would typically fetch from your analytics database
    return [];
  }

  // Send data to analytics service
  private async sendToAnalytics(event: AnalyticsEvent) {
    try {
      // Send to your analytics backend or third-party service
      // For example: Google Analytics, Mixpanel, Amplitude, etc.
      
      // Example for a custom analytics endpoint:
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics data:', error);
    }
  }

  // Generate reports
  async generateReport(type: 'daily' | 'weekly' | 'monthly') {
    const metrics = await this.calculateBusinessMetrics();
    
    return {
      type,
      generatedAt: new Date(),
      metrics,
      insights: this.generateInsights(metrics),
    };
  }

  private generateInsights(metrics: BusinessMetrics) {
    const insights = [];

    // Revenue insights
    if (metrics.revenue.mrr > 0) {
      insights.push({
        type: 'revenue',
        message: `Monthly recurring revenue is GHS ${metrics.revenue.mrr}`,
        trend: 'positive',
      });
    }

    // Customer insights
    if (metrics.customers.newCustomersThisMonth > 0) {
      insights.push({
        type: 'customers',
        message: `${metrics.customers.newCustomersThisMonth} new customers this month`,
        trend: 'positive',
      });
    }

    // Order insights
    if (metrics.orders.conversionRate > 0) {
      insights.push({
        type: 'orders',
        message: `Conversion rate is ${(metrics.orders.conversionRate * 100).toFixed(1)}%`,
        trend: 'positive',
      });
    }

    return insights;
  }
}

export const analyticsService = new AnalyticsService();

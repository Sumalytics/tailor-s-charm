import React from 'react';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

interface FeatureFlag {
  [key: string]: boolean;
}

class FeatureService {
  private features: Map<string, Feature> = new Map();
  private userFeatures: Map<string, boolean> = new Map();
  private userId?: string;
  private shopId?: string;

  constructor() {
    this.initializeFeatures();
    this.loadUserFeatures();
  }

  // Initialize all features
  private initializeFeatures() {
    const defaultFeatures: Feature[] = [
      {
        id: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Detailed business analytics and insights',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'bulk_operations',
        name: 'Bulk Operations',
        description: 'Perform bulk operations on customers and orders',
        enabled: true,
        rolloutPercentage: 50,
      },
      {
        id: 'ai_recommendations',
        name: 'AI Recommendations',
        description: 'AI-powered recommendations for customers and styles',
        enabled: false,
        rolloutPercentage: 10,
      },
      {
        id: 'mobile_app',
        name: 'Mobile App',
        description: 'Native mobile app for iOS and Android',
        enabled: false,
        rolloutPercentage: 0,
      },
      {
        id: 'advanced_reporting',
        name: 'Advanced Reporting',
        description: 'Custom reports and data export',
        enabled: true,
        rolloutPercentage: 75,
      },
      {
        id: 'integrations',
        name: 'Third-party Integrations',
        description: 'Integrate with external services',
        enabled: true,
        rolloutPercentage: 25,
      },
      {
        id: 'multi_shop',
        name: 'Multi-Shop Management',
        description: 'Manage multiple shops from one account',
        enabled: false,
        rolloutPercentage: 5,
      },
      {
        id: 'loyalty_program',
        name: 'Customer Loyalty Program',
        description: 'Reward system for repeat customers',
        enabled: true,
        rolloutPercentage: 30,
      },
      {
        id: 'inventory_management',
        name: 'Inventory Management',
        description: 'Track and manage fabric and materials',
        enabled: true,
        rolloutPercentage: 60,
      },
      {
        id: 'sms_notifications',
        name: 'SMS Notifications',
        description: 'Send SMS notifications to customers',
        enabled: true,
        rolloutPercentage: 40,
      },
    ];

    defaultFeatures.forEach(feature => {
      this.features.set(feature.id, feature);
    });
  }

  // Load user-specific features
  private loadUserFeatures() {
    // In a real app, this would fetch from your backend
    const storedFeatures = localStorage.getItem('userFeatures');
    if (storedFeatures) {
      const parsed = JSON.parse(storedFeatures);
      this.userFeatures = new Map(Object.entries(parsed));
    }
  }

  // Set user context
  setUserContext(userId: string, shopId?: string) {
    this.userId = userId;
    this.shopId = shopId;
    this.evaluateFeatures();
  }

  // Evaluate which features are available to this user
  private evaluateFeatures() {
    if (!this.userId) return;

    this.features.forEach((feature, id) => {
      const isEnabled = this.isFeatureEnabled(feature);
      this.userFeatures.set(id, isEnabled);
    });

    // Save to localStorage
    const featuresObject = Object.fromEntries(this.userFeatures);
    localStorage.setItem('userFeatures', JSON.stringify(featuresObject));
  }

  // Check if a feature is enabled for the current user
  private isFeatureEnabled(feature: Feature): boolean {
    if (!feature.enabled) return false;

    // If rollout is 100%, everyone gets it
    if (feature.rolloutPercentage === 100) return true;

    // If rollout is 0%, no one gets it
    if (feature.rolloutPercentage === 0) return false;

    // Check if user is in rollout percentage
    const userHash = this.hashUserId(this.userId!);
    const rolloutThreshold = feature.rolloutPercentage! / 100;
    return userHash < rolloutThreshold;
  }

  // Hash user ID for consistent rollout
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  // Public API to check if a feature is enabled
  isEnabled(featureId: string): boolean {
    return this.userFeatures.get(featureId) || false;
  }

  // Get all available features
  getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  // Get enabled features for current user
  getEnabledFeatures(): Feature[] {
    return Array.from(this.features.values()).filter(feature => 
      this.isEnabled(feature.id)
    );
  }

  // Enable/disable a feature (admin only)
  async toggleFeature(featureId: string, enabled: boolean): Promise<void> {
    const feature = this.features.get(featureId);
    if (feature) {
      feature.enabled = enabled;
      this.evaluateFeatures();
      
      // In a real app, this would update the backend
      await this.updateFeatureInBackend(featureId, { enabled });
    }
  }

  // Update feature rollout percentage
  async updateRollout(featureId: string, percentage: number): Promise<void> {
    const feature = this.features.get(featureId);
    if (feature) {
      feature.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.evaluateFeatures();
      
      // In a real app, this would update the backend
      await this.updateFeatureInBackend(featureId, { rolloutPercentage: percentage });
    }
  }

  // Update feature in backend (mock implementation)
  private async updateFeatureInBackend(featureId: string, updates: Partial<Feature>): Promise<void> {
    // In a real app, this would make an API call
    console.log(`Updating feature ${featureId}:`, updates);
    
    // Simulate API call
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  // Get feature usage analytics
  getFeatureUsage(): Record<string, { users: number; usage: number }> {
    // In a real app, this would fetch from your analytics
    const usage: Record<string, { users: number; usage: number }> = {};
    
    this.features.forEach((feature, id) => {
      usage[id] = {
        users: Math.floor(Math.random() * 1000),
        usage: Math.floor(Math.random() * 100),
      };
    });
    
    return usage;
  }

  // A/B testing utilities
  runExperiment(experimentId: string, variants: string[]): string {
    if (!this.userId) return variants[0];
    
    const hash = this.hashUserId(`${experimentId}_${this.userId}`);
    const variantIndex = Math.floor(hash * variants.length);
    return variants[variantIndex];
  }

  // Feature flag for React components
  withFeature<P extends object>(
    featureId: string,
    component: React.ComponentType<P>,
    fallback?: React.ComponentType<P>
  ) {
    return (props: P) => {
      if (this.isEnabled(featureId)) {
        return React.createElement(component, props);
      }
      return fallback ? React.createElement(fallback, props) : null;
    };
  }
}

// Export singleton instance
export const featureService = new FeatureService();

// Export hook for React components
export const useFeature = (featureId: string) => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  React.useEffect(() => {
    setIsEnabled(featureService.isEnabled(featureId));
  }, [featureId]);

  return isEnabled;
};

// Export hook for experiments
export const useExperiment = (experimentId: string, variants: string[]) => {
  const [variant, setVariant] = React.useState(variants[0]);

  React.useEffect(() => {
    setVariant(featureService.runExperiment(experimentId, variants));
  }, [experimentId, variants]);

  return variant;
};

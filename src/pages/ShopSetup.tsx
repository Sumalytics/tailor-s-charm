import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShopSettings } from '@/components/shop/ShopSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ShopSetup() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            Welcome to TailorFlow!
          </h1>
          <p className="text-muted-foreground">
            Let's set up your shop to get started with managing your tailoring business.
          </p>
        </div>

        {/* Shop Setup Form */}
        <div className="max-w-2xl mx-auto">
          <ShopSettings />
        </div>

        {/* Quick Start Guide */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Set up your shop information</p>
                <p className="text-sm text-muted-foreground">
                  Add your shop details, currency, and contact information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Add your first customers</p>
                <p className="text-sm text-muted-foreground">
                  Start building your customer database
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Create your first orders</p>
                <p className="text-sm text-muted-foreground">
                  Start managing tailoring orders and payments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Customize your shop (optional)</p>
                <p className="text-sm text-muted-foreground">
                  Add logo, customize receipts, and configure advanced settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

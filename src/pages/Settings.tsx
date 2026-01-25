import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  User,
  Bell,
  Shield,
  CreditCard,
  Users,
} from 'lucide-react';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your shop and account settings
          </p>
        </div>

        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="shop" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* Shop Settings */}
          <TabsContent value="shop" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Shop Information</CardTitle>
                <CardDescription>Update your shop's public information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Shop Name</Label>
                    <Input id="shopName" defaultValue="Elegant Tailors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopPhone">Phone Number</Label>
                    <Input id="shopPhone" defaultValue="+1 234-567-8900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopEmail">Email Address</Label>
                  <Input id="shopEmail" type="email" defaultValue="contact@eleganttailors.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopAddress">Address</Label>
                  <Textarea id="shopAddress" defaultValue="123 Fashion Street, Suite 100, New York, NY 10001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopDescription">Description</Label>
                  <Textarea id="shopDescription" defaultValue="Premium custom tailoring services for discerning clients. Specializing in bespoke suits, dresses, and alterations." />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set your shop's operating hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{day}</span>
                      <div className="flex items-center gap-2">
                        <Input className="w-24" defaultValue={day === 'Sunday' ? 'Closed' : '09:00'} />
                        <span className="text-muted-foreground">to</span>
                        <Input className="w-24" defaultValue={day === 'Sunday' ? 'Closed' : '18:00'} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">JD</span>
                  </div>
                  <Button variant="outline">Change Photo</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john@eleganttailors.com" />
                </div>
                <Button>Update Profile</Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline">Change Password</Button>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your shop's staff</CardDescription>
                  </div>
                  <Button>Invite Member</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'John Doe', email: 'john@eleganttailors.com', role: 'Admin' },
                    { name: 'Jane Smith', email: 'jane@eleganttailors.com', role: 'Staff' },
                    { name: 'Mike Johnson', email: 'mike@eleganttailors.com', role: 'Staff' },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'New Orders', description: 'Get notified when a new order is placed' },
                  { title: 'Payment Received', description: 'Get notified when a payment is received' },
                  { title: 'Order Due Reminders', description: 'Get reminded about upcoming due dates' },
                  { title: 'Low Inventory Alerts', description: 'Get alerts when inventory is running low' },
                  { title: 'Customer Messages', description: 'Get notified about customer inquiries' },
                ].map((notification) => (
                  <div key={notification.title} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Professional Plan</h3>
                      <p className="text-muted-foreground">$29/month • Billed monthly</p>
                    </div>
                    <Badge className="bg-primary">Active</Badge>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Unlimited customers
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Unlimited orders
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      5 team members
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Priority support
                    </li>
                  </ul>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline" className="text-destructive">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

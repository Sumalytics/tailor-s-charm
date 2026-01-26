import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ShopSettings from '@/components/settings/ShopSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import TeamSettings from '@/components/settings/TeamSettings';
import BillingSettings from '@/components/settings/BillingSettings';
import { BillingPlansManager } from '@/components/admin/BillingPlansManager';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import ShopsManagement from '@/components/admin/ShopsManagement';
import PaystackPayment from '@/components/payment/PaystackPayment';
import {
  Store,
  User,
  Shield,
  CreditCard,
  Users,
  Plus,
  Edit,
  Trash2,
  Crown,
  Settings as SettingsIcon,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getTeamMembers, 
  updateTeamMemberRole, 
  removeTeamMember,
  getShopSubscription,
  getBillingPlans,
  createBillingPlan,
  updateBillingPlan,
  deleteBillingPlan,
  updateDocument,
  addDocument
} from '@/firebase/firestore';
import { User as UserType, BillingPlan, Subscription, UserRole } from '@/types';
import { getCollection } from '@/firebase/firestore';

export default function Settings() {
  const { currentUser, userRole, shopId } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Plan selection modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  
  // Get tab from URL parameter
  const tabParam = searchParams.get('tab');
  const getDefaultTab = () => {
    if (tabParam && ['shop', 'profile', 'team', 'billing', 'admin', 'analytics', 'shops'].includes(tabParam)) {
      return tabParam;
    }
    return isSuperAdmin ? "admin" : "shop";
  };

  // Function to switch to billing tab
  const goToBillingTab = () => {
    setSearchParams({ tab: 'billing' });
  };

  // Function to load available plans for modal
  const loadAvailablePlans = async () => {
    setPlansLoading(true);
    try {
      const plans = await getCollection<BillingPlan>('plans', [
        { field: 'isActive', operator: '==', value: true }
      ]);
      // Filter out free plans for selection
      const paidPlans = plans.filter(plan => plan.type !== 'FREE');
      setAvailablePlans(paidPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available plans',
        variant: 'destructive',
      });
    } finally {
      setPlansLoading(false);
    }
  };

  // Function to open plan selection modal
  const openPlanSelection = () => {
    loadAvailablePlans();
    setShowPlanModal(true);
  };

  // Function to handle plan selection
  const handlePlanSelect = (plan: BillingPlan) => {
    setSelectedPlan(plan);
    setShowPlanModal(false);
  };

  // Function to handle payment success
  const handlePaymentSuccess = async (reference: string) => {
    if (!shopId || !selectedPlan) return;

    try {
      // Create new subscription
      const subscriptionData = {
        shopId,
        planId: selectedPlan.id,
        plan: selectedPlan,
        status: 'ACTIVE',
        billingCycle: selectedPlan.billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(
          Date.now() + (selectedPlan.billingCycle === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDocument('subscriptions', subscriptionData);

      toast({
        title: 'Payment Successful!',
        description: `Your subscription has been upgraded to ${selectedPlan.name}.`,
      });

      setSelectedPlan(null);
      loadSettingsData(); // Refresh subscription data
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate subscription. Please contact support.',
        variant: 'destructive',
      });
    }
  };
  
  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    displayName: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Team invitation state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'STAFF' as UserRole,
    message: '',
  });
  const [invitingMember, setInvitingMember] = useState(false);

  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      setIsSuperAdmin(true);
    }
    if (shopId) {
      loadSettingsData();
    }
    // Initialize profile data when currentUser changes
    if (currentUser) {
      const nameParts = currentUser.displayName?.split(' ') || ['', ''];
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
      });
    }
  }, [shopId, userRole, currentUser]);

  const loadSettingsData = async () => {
    if (!shopId || !currentUser) return;

    setLoading(true);
    try {
      const [teamData, subscriptionData, plansData] = await Promise.all([
        getTeamMembers(shopId),
        getShopSubscription(shopId),
        isSuperAdmin ? getBillingPlans() : Promise.resolve([])
      ]);

      setTeamMembers(teamData);
      setSubscription(subscriptionData);
      setBillingPlans(plansData);
    } catch (error) {
      console.error('Error loading settings data:', error);
      toast({
        title: 'Error loading settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateTeamMemberRole(userId, newRole);
      await loadSettingsData();
      toast({
        title: 'Role updated',
        description: 'Team member role has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await removeTeamMember(userId);
      await loadSettingsData();
      toast({
        title: 'Member removed',
        description: 'Team member has been removed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error removing member',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBillingPlan = async (planData: Omit<BillingPlan, 'id'>) => {
    try {
      await createBillingPlan(planData);
      await loadSettingsData();
      toast({
        title: 'Billing plan created',
        description: 'New billing plan has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error creating billing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBillingPlan = async (planId: string, updates: Partial<BillingPlan>) => {
    try {
      await updateBillingPlan(planId, updates);
      await loadSettingsData();
      toast({
        title: 'Billing plan updated',
        description: 'Billing plan has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating billing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBillingPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this billing plan?')) return;

    try {
      await deleteBillingPlan(planId);
      await loadSettingsData();
      toast({
        title: 'Billing plan deleted',
        description: 'Billing plan has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting billing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    setUpdatingProfile(true);
    try {
      const displayName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();
      
      await updateDocument('users', currentUser.uid, {
        displayName,
        email: profileData.email,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error updating profile',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      // TODO: Implement actual photo upload to Firebase Storage
      // For now, just show a success message
      toast({
        title: 'Photo upload coming soon',
        description: 'Photo upload functionality will be implemented in a future update.',
      });
    } catch (error) {
      toast({
        title: 'Error uploading photo',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInviteMember = async () => {
    if (!currentUser || !shopId) return;

    if (!inviteData.email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address for the team member.',
        variant: 'destructive',
      });
      return;
    }

    setInvitingMember(true);
    try {
      // Create team invitation record
      const invitationData = {
        email: inviteData.email.trim().toLowerCase(),
        role: inviteData.role,
        message: inviteData.message,
        shopId: shopId,
        invitedBy: currentUser.uid,
        invitedByName: currentUser.displayName,
        shopName: 'Your Shop', // TODO: Get actual shop name
        status: 'PENDING',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      await addDocument('teamInvitations', invitationData);

      // Reset form
      setInviteData({
        email: '',
        role: 'STAFF',
        message: '',
      });
      setShowInviteDialog(false);

      toast({
        title: 'Invitation sent',
        description: `Invitation has been sent to ${inviteData.email}`,
      });
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast({
        title: 'Error sending invitation',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInvitingMember(false);
    }
  };

  const handleInviteChange = (field: string, value: string | UserRole) => {
    setInviteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
          <div className="text-muted-foreground mt-1 flex items-center flex-wrap gap-2">
            <span>Manage your shop and account settings</span>
            {isSuperAdmin && (
              <Badge variant="secondary">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <TabsList className="bg-secondary/50">
            {!isSuperAdmin && (
              <>
                <TabsTrigger value="shop" className="gap-2">
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Shop</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
              </>
            )}
            {isSuperAdmin && (
              <>
                <TabsTrigger value="admin" className="gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="shops" className="gap-2">
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Shops</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Shop Settings */}
          <TabsContent value="shop" className="space-y-6">
            <ShopSettings />
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
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {profileData.firstName?.[0] || profileData.displayName?.[0] || 'U'}
                      </span>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Change Photo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updatingProfile || !profileData.firstName.trim() || !profileData.email.trim()}
                >
                  {updatingProfile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
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
                <Button variant="outline">
                  Change Password
                </Button>
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
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No team members yet</p>
                    <Button className="mt-2" onClick={() => setShowInviteDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite First Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.uid} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.displayName?.split(' ').map((n) => n[0]).join('') || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.displayName}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value: UserRole) => handleRoleChange(member.uid, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="STAFF">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.uid)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invite Team Member Dialog */}
          {showInviteDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Invite Team Member</CardTitle>
                  <CardDescription>
                    Send an invitation to join your team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={inviteData.email}
                      onChange={(e) => handleInviteChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteRole">Role</Label>
                    <Select
                      value={inviteData.role}
                      onValueChange={(value: UserRole) => handleInviteChange('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteMessage">Message (Optional)</Label>
                    <Textarea
                      id="inviteMessage"
                      placeholder="Add a personal message to the invitation..."
                      value={inviteData.message}
                      onChange={(e) => handleInviteChange('message', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowInviteDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInviteMember}
                      disabled={invitingMember || !inviteData.email.trim()}
                      className="flex-1"
                    >
                      {invitingMember ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{subscription.plan.name}</h3>
                        <p className="text-muted-foreground">
                          ${subscription.plan.price}/{subscription.plan.billingCycle.toLowerCase()} • Billed {subscription.plan.billingCycle.toLowerCase()}
                        </p>
                      </div>
                      <Badge className={subscription.status === 'ACTIVE' ? 'bg-primary' : 'bg-warning'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {subscription.plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-4 mt-4">
                      <Button variant="outline">Change Plan</Button>
                      {subscription.status === 'ACTIVE' && (
                        <Button variant="outline" className="text-destructive">
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No active subscription</p>
                    <Button 
                      className="mt-2"
                      onClick={openPlanSelection}
                    >
                      Choose a Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Settings - Super Admin Only */}
          {isSuperAdmin && (
            <>
              <TabsContent value="admin" className="space-y-6">
                <BillingPlansManager />
              </TabsContent>
              <TabsContent value="analytics" className="space-y-6">
                <AdminAnalytics />
              </TabsContent>
              <TabsContent value="shops" className="space-y-6">
                <ShopsManagement />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Plan Selection Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Select the perfect plan for your business needs
            </DialogDescription>
          </DialogHeader>
          
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {availablePlans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="text-center">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.type} plan</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {plan.currency} {plan.price}
                      </div>
                      <div className="text-sm text-gray-600">/{plan.billingCycle.toLowerCase()}</div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Features:</p>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Limits:</p>
                      <div className="text-xs space-y-1">
                        <div>• {plan.limits.customers} customers</div>
                        <div>• {plan.limits.orders} orders/month</div>
                        <div>• {plan.limits.teamMembers} team members</div>
                        <div>• {plan.limits.storage}MB storage</div>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => handlePlanSelect(plan)}
                    >
                      Select {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedPlan && (
        <Dialog open={true} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Subscription</DialogTitle>
              <DialogDescription>
                Upgrade to {selectedPlan.name} - {selectedPlan.currency} {selectedPlan.price}/{selectedPlan.billingCycle.toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            
            {currentUser && (
              <PaystackPayment
                email={currentUser.email || ''}
                amount={selectedPlan.price}
                description={`Subscribe to ${selectedPlan.name} plan`}
                metadata={{
                  planId: selectedPlan.id,
                  planName: selectedPlan.name,
                  shopId,
                  userId: currentUser.uid,
                }}
                onSuccess={handlePaymentSuccess}
                onError={(error) => {
                  console.error('Payment error:', error);
                  toast({
                    title: 'Payment Failed',
                    description: 'Your payment could not be processed. Please try again.',
                    variant: 'destructive',
                  });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}

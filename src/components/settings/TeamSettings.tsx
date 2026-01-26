import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection, addDocument, updateDocument, deleteDocument } from '@/firebase/firestore';
import { Users, Plus, Mail, Crown, Shield, User, Trash2, Edit } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  invitedAt: Date;
  joinedAt?: Date;
  lastActive?: Date;
  permissions: {
    canManageOrders: boolean;
    canManageCustomers: boolean;
    canManagePayments: boolean;
    canViewReports: boolean;
  };
}

export default function TeamSettings() {
  const { currentUser, shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
    permissions: {
      canManageOrders: true,
      canManageCustomers: true,
      canManagePayments: false,
      canViewReports: false,
    },
  });

  useEffect(() => {
    if (shopId) {
      loadTeamMembers();
    }
  }, [shopId]);

  const loadTeamMembers = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const members = await getCollection<TeamMember>('teamMembers', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeamMember = async () => {
    if (!shopId || !currentUser) return;

    if (!inviteForm.email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setInviting(true);
    try {
      const newMember: Omit<TeamMember, 'id'> = {
        email: inviteForm.email,
        displayName: inviteForm.email.split('@')[0],
        role: inviteForm.role,
        status: 'PENDING',
        invitedAt: new Date(),
        permissions: inviteForm.permissions,
        shopId,
        invitedBy: currentUser.uid,
      };

      await addDocument('teamMembers', newMember);

      toast({
        title: 'Success',
        description: `Invitation sent to ${inviteForm.email}`,
      });

      setInviteDialogOpen(false);
      setInviteForm({
        email: '',
        role: 'MEMBER',
        permissions: {
          canManageOrders: true,
          canManageCustomers: true,
          canManagePayments: false,
          canViewReports: false,
        },
      });

      loadTeamMembers();
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateDocument('teamMembers', memberId, {
        role: newRole,
        updatedAt: new Date(),
      });

      toast({
        title: 'Success',
        description: 'Team member role updated',
      });

      loadTeamMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      await deleteDocument('teamMembers', memberId);

      toast({
        title: 'Success',
        description: 'Team member removed',
      });

      loadTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage your team members and their permissions
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="member@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as 'ADMIN' | 'MEMBER' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {Object.entries(inviteForm.permissions).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={key}
                            checked={value}
                            onChange={(e) => setInviteForm(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [key]: e.target.checked
                              }
                            }))}
                            className="rounded"
                          />
                          <Label htmlFor={key} className="text-sm">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleInviteTeamMember} disabled={inviting} className="w-full">
                    {inviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-500 mb-4">Invite team members to help manage your shop</p>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Your First Member
                </Button>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {getInitials(member.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{member.displayName}</p>
                        {getRoleIcon(member.role)}
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400">
                        Invited {new Date(member.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                      disabled={member.role === 'OWNER'}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={member.role === 'OWNER'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Team Statistics</CardTitle>
          <CardDescription>
            Overview of your team composition and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {teamMembers.length}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {teamMembers.filter(m => m.status === 'PENDING').length}
              </div>
              <div className="text-sm text-gray-600">Pending Invitations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

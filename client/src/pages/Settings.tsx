import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserIcon, BellIcon, ShieldIcon, LogOutIcon } from 'lucide-react';
import UsernameProfile from '@/components/UsernameProfile';

export default function Settings() {
  const { user, logout, setUser } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };
  
  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
  };
  
  const saveNotificationSettings = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated',
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user?.displayName} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user?.email} disabled />
              </div>
              
              {/* Username Section */}
              {user && (
                <div className="space-y-2">
                  <Label>Username</Label>
                  <UsernameProfile 
                    user={{
                      id: user.id,
                      email: user.email,
                      displayName: user.displayName,
                      beawareUsername: user.beawareUsername || null,
                      hasChangedUsername: user.hasChangedUsername
                    }}
                    onUserUpdate={handleUserUpdate}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-muted rounded-md text-sm font-medium capitalize">
                    {user?.role}
                  </span>
                  {user?.role === 'admin' && (
                    <span className="text-xs text-muted-foreground">Admin accounts have additional permissions</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Authentication Provider</Label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-muted rounded-md text-sm font-medium capitalize">
                    {user?.authProvider || 'Local'}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
                <LogOutIcon className="h-4 w-4" /> Log Out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Decide what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive email notifications about scam reports and account activity
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Report Updates</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive notifications when your reports are verified or receive comments
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Security Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified about important security events related to your account
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNotificationSettings}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Change Password</Label>
                {user?.authProvider === 'google' ? (
                  <Alert>
                    <AlertTitle>Google Account</AlertTitle>
                    <AlertDescription>
                      You signed up with Google. Password changes should be managed through your Google account.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-sm">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {user?.authProvider !== 'google' && (
                <Button>Update Password</Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
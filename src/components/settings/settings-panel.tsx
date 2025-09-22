"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { WidgetCustomization } from "./widget-customization";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Loader2, Save, User, Building2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

type PersonalInfo = {
  display_name: string;
  email: string;
  online_status: string;
};

type OrganizationInfo = {
  name: string;
  slug: string;
  brand_color: string;
};

export function SettingsPanel() {
  const { agent, organization } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    display_name: "",
    email: "",
    online_status: "OFFLINE",
  });
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    name: "",
    slug: "",
    brand_color: "#3B82F6",
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Handle tab state from URL parameters
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['general', 'widget', 'billing', 'notifications', 'security'].includes(section)) {
      setActiveTab(section);
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Load initial data
  useEffect(() => {
    if (agent) {
      setPersonalInfo({
        display_name: agent.display_name || "",
        email: agent.email || "",
        online_status: agent.online_status || "OFFLINE",
      });
    }
  }, [agent]);

  useEffect(() => {
    if (organization) {
      setOrganizationInfo({
        name: organization.name || "",
        slug: organization.slug || "",
        brand_color: organization.brand_color || "#3B82F6",
      });
    }
  }, [organization]);

  const savePersonalInfo = async () => {
    if (!agent) return;
    
    setIsSavingPersonal(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase client not available");

      const { error } = await supabase
        .from("agents")
        .update({
          display_name: personalInfo.display_name,
          online_status: personalInfo.online_status,
        })
        .eq("id", agent.id);

      if (error) throw error;

      toast.success("Personal information updated successfully!");
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error("Failed to update personal information");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const saveOrganizationInfo = async () => {
    if (!organization) return;
    
    setIsSavingOrg(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase client not available");

      const { error } = await supabase
        .from("organizations")
        .update({
          name: organizationInfo.name,
          slug: organizationInfo.slug,
          brand_color: organizationInfo.brand_color,
        })
        .eq("id", organization.id);

      if (error) throw error;

      toast.success("Organization information updated successfully!");
    } catch (error) {
      console.error("Error updating organization info:", error);
      toast.error("Failed to update organization information");
    } finally {
      setIsSavingOrg(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your personal information and organization settings
        </p>
      </div>
      
             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
               <TabsList className="grid w-full grid-cols-5">
                 <TabsTrigger value="general">General</TabsTrigger>
                 <TabsTrigger value="widget">Widget Settings</TabsTrigger>
                 <TabsTrigger value="billing">Billing</TabsTrigger>
                 <TabsTrigger value="notifications">Notifications</TabsTrigger>
                 <TabsTrigger value="security">Security</TabsTrigger>
               </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={personalInfo.display_name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, display_name: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={personalInfo.email}
                    disabled
                    className="bg-gray-50"
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed here</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onlineStatus">Online Status</Label>
                  <Select
                    value={personalInfo.online_status}
                    onValueChange={(value) => setPersonalInfo({ ...personalInfo, online_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="OFFLINE">Offline</SelectItem>
                      <SelectItem value="AWAY">Away</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={savePersonalInfo} 
                    disabled={isSavingPersonal}
                    className="w-full"
                  >
                    {isSavingPersonal ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Personal Info
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organization Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={organizationInfo.name}
                    onChange={(e) => setOrganizationInfo({ ...organizationInfo, name: e.target.value })}
                    placeholder="Your organization name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orgSlug">Organization Slug</Label>
                  <Input
                    id="orgSlug"
                    value={organizationInfo.slug}
                    onChange={(e) => setOrganizationInfo({ ...organizationInfo, slug: e.target.value })}
                    placeholder="your-org-slug"
                  />
                  <p className="text-xs text-gray-500">Used in URLs and API endpoints</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brandColor">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandColor"
                      type="color"
                      value={organizationInfo.brand_color}
                      onChange={(e) => setOrganizationInfo({ ...organizationInfo, brand_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={organizationInfo.brand_color}
                      onChange={(e) => setOrganizationInfo({ ...organizationInfo, brand_color: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={saveOrganizationInfo} 
                    disabled={isSavingOrg}
                    className="w-full"
                  >
                    {isSavingOrg ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Organization Info
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widget" className="mt-6">
          <WidgetCustomization />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Management</h3>
                <p className="text-gray-600 mb-4">Manage your subscription, view invoices, and update payment methods.</p>
                <Button variant="outline">Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable notifications</div>
                  <div className="text-sm text-muted-foreground">Get alerts for new messages</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email notifications</div>
                  <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Desktop notifications</div>
                  <div className="text-sm text-muted-foreground">Show browser notifications</div>
                </div>
                <Switch />
              </div>
              <div className="pt-4">
                <Button>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
                <p className="text-gray-600 mb-4">Manage your account security, passwords, and privacy settings.</p>
                <Button variant="outline">Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



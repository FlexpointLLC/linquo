"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, User, Building2, Palette, Bell, Check } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { WidgetPreview } from "@/components/settings/widget-preview";

type PersonalInfo = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  online_status: string;
  org_id: string;
  role: string;
};

type OrganizationInfo = {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  widget_text_line1?: string;
  widget_text_line2?: string;
  widget_icon_alignment?: string;
  widget_show_branding?: boolean;
  chat_header_name?: string;
  chat_header_subtitle?: string;
  widget_button_text?: string;
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingWidget, setIsSavingWidget] = useState(false);
  const [loading, setLoading] = useState(true);

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
    router.push(`/dashboard/settings?${params.toString()}`, { scroll: false });
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase client not available");

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get agent data
        const { data: agentData, error: agentError } = await supabase
          .from("agents")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (agentError) throw agentError;
        if (!agentData) throw new Error("Agent not found");

        setPersonalInfo(agentData);

        // Get organization data
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", agentData.org_id)
          .single();

        if (orgError) throw orgError;
        if (!orgData) throw new Error("Organization not found");

        setOrganizationInfo(orgData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save personal info
  const savePersonalInfo = async () => {
    if (!personalInfo) return;
    setIsSavingPersonal(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error: updateError } = await supabase
        .from("agents")
        .update({
          display_name: personalInfo.display_name,
          online_status: personalInfo.online_status,
          updated_at: new Date().toISOString()
        })
        .eq("id", personalInfo.id);

      if (updateError) throw updateError;

      // Verify update
      const { data: updated, error: verifyError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", personalInfo.id)
        .single();

      if (verifyError) throw verifyError;
      if (!updated) throw new Error("Failed to verify update");

      setPersonalInfo(updated);
      toast.success("Personal information updated successfully!");
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error("Failed to update personal information");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Save organization info
  const saveOrganizationInfo = async () => {
    if (!organizationInfo) return;
    setIsSavingOrg(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          name: organizationInfo.name,
          slug: organizationInfo.slug,
          brand_color: organizationInfo.brand_color,
          updated_at: new Date().toISOString()
        })
        .eq("id", organizationInfo.id);

      if (updateError) throw updateError;

      // Verify update
      const { data: updated, error: verifyError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationInfo.id)
        .single();

      if (verifyError) throw verifyError;
      if (!updated) throw new Error("Failed to verify update");

      setOrganizationInfo(updated);
      toast.success("Organization information updated successfully!");
    } catch (error) {
      console.error("Error updating organization info:", error);
      toast.error("Failed to update organization information");
    } finally {
      setIsSavingOrg(false);
    }
  };

  // Save widget settings
  const saveWidgetSettings = async () => {
    if (!organizationInfo) return;
    setIsSavingWidget(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          brand_color: organizationInfo.brand_color,
          widget_text_line1: organizationInfo.widget_text_line1,
          widget_text_line2: organizationInfo.widget_text_line2,
          widget_icon_alignment: organizationInfo.widget_icon_alignment,
          widget_show_branding: organizationInfo.widget_show_branding,
          chat_header_name: organizationInfo.chat_header_name,
          chat_header_subtitle: organizationInfo.chat_header_subtitle,
          widget_button_text: organizationInfo.widget_button_text,
          updated_at: new Date().toISOString()
        })
        .eq("id", organizationInfo.id);

      if (updateError) throw updateError;

      // Verify update
      const { data: updated, error: verifyError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationInfo.id)
        .single();

      if (verifyError) throw verifyError;
      if (!updated) throw new Error("Failed to verify update");

      setOrganizationInfo(updated);
      toast.success("Widget settings updated successfully!");
    } catch (error) {
      console.error("Error saving widget settings:", error);
      toast.error("Failed to save widget settings");
    } finally {
      setIsSavingWidget(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!personalInfo || !organizationInfo) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load settings. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and organization settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="widget">Widget Settings</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                    className="bg-muted"
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
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
                  <p className="text-xs text-muted-foreground">Used in URLs and API endpoints</p>
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
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Widget Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="widgetBrandColor">Brand Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="widgetBrandColor"
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

                  <div className="grid gap-2">
                    <Label htmlFor="welcomeMessage1">Welcome Message Line 1</Label>
                    <Input
                      id="welcomeMessage1"
                      value={organizationInfo.widget_text_line1 || ''}
                      onChange={(e) => setOrganizationInfo({ ...organizationInfo, widget_text_line1: e.target.value })}
                      placeholder="Hi! How can we help?"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="welcomeMessage2">Welcome Message Line 2</Label>
                    <Input
                      id="welcomeMessage2"
                      value={organizationInfo.widget_text_line2 || ''}
                      onChange={(e) => setOrganizationInfo({ ...organizationInfo, widget_text_line2: e.target.value })}
                      placeholder="We usually reply in a few minutes"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={organizationInfo.widget_button_text || ''}
                      onChange={(e) => setOrganizationInfo({ ...organizationInfo, widget_button_text: e.target.value })}
                      placeholder="Send us a message"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Icon Alignment</Label>
                        <p className="text-sm text-muted-foreground">
                          Position of the chat widget icon
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Pro</span>
                        <Select
                          value={organizationInfo.widget_icon_alignment || 'right'}
                          onValueChange={(value) => setOrganizationInfo({ ...organizationInfo, widget_icon_alignment: value })}
                          disabled
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Show Branding</Label>
                        <p className="text-sm text-muted-foreground">
                          Display &quot;Powered by Linquo&quot; in widget
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Pro</span>
                        <Switch
                          checked={organizationInfo.widget_show_branding || false}
                          onCheckedChange={(checked) => setOrganizationInfo({ ...organizationInfo, widget_show_branding: checked })}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={saveWidgetSettings}
                      disabled={isSavingWidget}
                      className="w-full"
                    >
                      {isSavingWidget ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Widget Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="sticky top-6 z-10">
              <WidgetPreview
                brandColor={organizationInfo.brand_color}
                textLine1={organizationInfo.widget_text_line1 || 'Hi! How can we help?'}
                textLine2={organizationInfo.widget_text_line2 || 'We usually reply in a few minutes'}
                iconAlignment={(organizationInfo.widget_icon_alignment as "left" | "right") || 'right'}
                showPoweredBy={organizationInfo.widget_show_branding || false}
                chatHeaderName={organizationInfo.chat_header_name || organizationInfo.name}
                chatHeaderSubtitle={organizationInfo.chat_header_subtitle || 'We are here to help'}
                buttonText={organizationInfo.widget_button_text || 'Send us a message'}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Free Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Up to 100 conversations/month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Basic widget customization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Email notifications
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Pro Plan
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Advanced widget customization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Remove branding
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Advanced analytics
                  </li>
                </ul>
                <Button className="w-full">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notification settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

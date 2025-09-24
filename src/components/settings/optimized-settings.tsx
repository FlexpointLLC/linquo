"use client";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Building2, Palette, Shield, Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { WidgetPreview } from "@/components/settings/widget-preview";
import { useSearchParams, useRouter } from "next/navigation";

// Types
interface PersonalInfo {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  online_status: string;
  org_id: string;
  role: string;
}

interface OrganizationInfo {
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
}

// Global cache to persist data across tab changes
let settingsCache: {
  personalInfo: PersonalInfo | null;
  organizationInfo: OrganizationInfo | null;
  lastLoaded: number | null;
} = {
  personalInfo: null,
  organizationInfo: null,
  lastLoaded: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const OptimizedSettings = memo(function OptimizedSettings() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({
    personal: false,
    organization: false,
    widget: false,
  });

  // Handle tab state from URL parameters
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['general', 'widget', 'billing', 'security'].includes(section)) {
      setActiveTab(section);
    }
  }, [searchParams]);

  // Handle tab change - optimized to not cause re-renders
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', value);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Load data with caching - only loads once unless cache expires
  const loadData = useCallback(async () => {
    // Check cache first
    if (settingsCache.lastLoaded && 
        Date.now() - settingsCache.lastLoaded < CACHE_DURATION &&
        settingsCache.personalInfo && 
        settingsCache.organizationInfo) {
      console.log('📦 Using cached settings data');
      setPersonalInfo(settingsCache.personalInfo);
      setOrganizationInfo(settingsCache.organizationInfo);
      setLoading(false);
      return;
    }

    console.log('🔄 Loading fresh settings data');
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Parallel data fetching for better performance
      const [agentResult, orgResult] = await Promise.all([
        supabase.from("agents").select("*").eq("user_id", user.id).single(),
        supabase.from("agents").select("org_id").eq("user_id", user.id).single()
          .then(({ data: agentData }) => 
            agentData ? supabase.from("organizations").select("*").eq("id", agentData.org_id).single() : null
          )
      ]);

      if (agentResult.error) throw agentResult.error;
      if (!agentResult.data) throw new Error("Agent not found");

      const orgData = orgResult?.data;
      if (!orgData) throw new Error("Organization not found");

      // Get conversation count for this organization
      const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("id", { count: 'exact' })
        .eq("org_id", agentResult.data.org_id);

      if (conversationError) {
        console.warn("Error fetching conversation count:", conversationError);
      }

      const totalConversations = conversations?.length || 0;

      // Update cache and state
      settingsCache = {
        personalInfo: agentResult.data,
        organizationInfo: orgData,
        lastLoaded: Date.now(),
      };

      setPersonalInfo(agentResult.data);
      setOrganizationInfo(orgData);
      setConversationCount(totalConversations);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data only once on mount
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array - only run once

  // Optimized save functions with proper state management
  const savePersonalInfo = useCallback(async () => {
    if (!personalInfo) return;
    setSaving(prev => ({ ...prev, personal: true }));
    
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error } = await supabase
        .from("agents")
        .update({
          display_name: personalInfo.display_name,
          online_status: personalInfo.online_status,
          updated_at: new Date().toISOString()
        })
        .eq("id", personalInfo.id);

      if (error) throw error;

      // Update cache
      settingsCache.personalInfo = personalInfo;
      toast.success("Personal information updated successfully!");
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error("Failed to update personal information");
    } finally {
      setSaving(prev => ({ ...prev, personal: false }));
    }
  }, [personalInfo]);

  const saveOrganizationInfo = useCallback(async () => {
    if (!organizationInfo) return;
    setSaving(prev => ({ ...prev, organization: true }));
    
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error } = await supabase
        .from("organizations")
        .update({
          name: organizationInfo.name,
          slug: organizationInfo.slug,
          brand_color: organizationInfo.brand_color,
          updated_at: new Date().toISOString()
        })
        .eq("id", organizationInfo.id);

      if (error) throw error;

      // Update cache
      settingsCache.organizationInfo = organizationInfo;
      toast.success("Organization information updated successfully!");
    } catch (error) {
      console.error("Error updating organization info:", error);
      toast.error("Failed to update organization information");
    } finally {
      setSaving(prev => ({ ...prev, organization: false }));
    }
  }, [organizationInfo]);

  const saveWidgetSettings = useCallback(async () => {
    if (!organizationInfo) return;
    setSaving(prev => ({ ...prev, widget: true }));
    
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error } = await supabase
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

      if (error) throw error;

      // Update cache
      settingsCache.organizationInfo = organizationInfo;
      toast.success("Widget settings updated successfully!");
    } catch (error) {
      console.error("Error saving widget settings:", error);
      toast.error("Failed to save widget settings");
    } finally {
      setSaving(prev => ({ ...prev, widget: false }));
    }
  }, [organizationInfo]);

  // Optimized input handlers
  const updatePersonalInfo = useCallback((field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const updateOrganizationInfo = useCallback((field: keyof OrganizationInfo, value: string | boolean) => {
    setOrganizationInfo(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  // Memoized widget preview props to prevent unnecessary re-renders
  const widgetPreviewProps = useMemo(() => ({
    brandColor: organizationInfo?.brand_color || '#3B82F6',
    textLine1: organizationInfo?.widget_text_line1 || 'Hi! How can we help?',
    textLine2: organizationInfo?.widget_text_line2 || 'We usually reply in a few minutes',
    iconAlignment: (organizationInfo?.widget_icon_alignment as "left" | "right") || 'right',
    showPoweredBy: organizationInfo?.widget_show_branding || false,
    chatHeaderName: organizationInfo?.chat_header_name || organizationInfo?.name || 'Support',
    chatHeaderSubtitle: organizationInfo?.chat_header_subtitle || 'We are here to help',
    buttonText: organizationInfo?.widget_button_text || 'Send us a message',
  }), [organizationInfo]);

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
                    onChange={(e) => updatePersonalInfo('display_name', e.target.value)}
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
                    onValueChange={(value) => updatePersonalInfo('online_status', value)}
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
                    disabled={saving.personal}
                    className="w-full"
                  >
                    {saving.personal ? (
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
                    onChange={(e) => updateOrganizationInfo('name', e.target.value)}
                    placeholder="Your organization name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orgSlug">Organization Slug</Label>
                  <Input
                    id="orgSlug"
                    value={organizationInfo.slug}
                    onChange={(e) => updateOrganizationInfo('slug', e.target.value)}
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
                      onChange={(e) => updateOrganizationInfo('brand_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={organizationInfo.brand_color}
                      onChange={(e) => updateOrganizationInfo('brand_color', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={saveOrganizationInfo}
                    disabled={saving.organization}
                    className="w-full"
                  >
                    {saving.organization ? (
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
                        onChange={(e) => updateOrganizationInfo('brand_color', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={organizationInfo.brand_color}
                        onChange={(e) => updateOrganizationInfo('brand_color', e.target.value)}
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
                      onChange={(e) => updateOrganizationInfo('widget_text_line1', e.target.value)}
                      placeholder="Hi! How can we help?"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="welcomeMessage2">Welcome Message Line 2</Label>
                    <Input
                      id="welcomeMessage2"
                      value={organizationInfo.widget_text_line2 || ''}
                      onChange={(e) => updateOrganizationInfo('widget_text_line2', e.target.value)}
                      placeholder="We usually reply in a few minutes"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={organizationInfo.widget_button_text || ''}
                      onChange={(e) => updateOrganizationInfo('widget_button_text', e.target.value)}
                      placeholder="Send us a message"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-base">Icon Alignment</Label>
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">Pro</span>
                      </div>
                      <Select
                        value={organizationInfo.widget_icon_alignment || 'right'}
                        onValueChange={(value) => updateOrganizationInfo('widget_icon_alignment', value)}
                        disabled
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-base">Show Branding</Label>
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">Pro</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Display &quot;Powered by Linquo&quot; in widget
                        </p>
                      </div>
                      <Switch
                        checked={organizationInfo.widget_show_branding || false}
                        onCheckedChange={(checked) => updateOrganizationInfo('widget_show_branding', checked)}
                        disabled
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label htmlFor="headerName">Header Name</Label>
                    <Input
                      id="headerName"
                      value={organizationInfo.chat_header_name || ''}
                      onChange={(e) => updateOrganizationInfo('chat_header_name', e.target.value)}
                      placeholder="Support Team"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="headerSubtitle">Header Subtitle</Label>
                    <Input
                      id="headerSubtitle"
                      value={organizationInfo.chat_header_subtitle || ''}
                      onChange={(e) => updateOrganizationInfo('chat_header_subtitle', e.target.value)}
                      placeholder="Typically replies within 1 min"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={saveWidgetSettings}
                      disabled={saving.widget}
                      className="w-full"
                    >
                      {saving.widget ? (
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
              <WidgetPreview {...widgetPreviewProps} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Current Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Currently on Free Plan</p>
                    <p className="text-sm text-muted-foreground">100 conversations • Basic features</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">$0</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>

              {/* Upgrade Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Only</span>
                      <span className="text-2xl font-bold">$2</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-start items-end">
                    <Button size="lg" className="w-48">
                      Upgrade Now
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cancel anytime • No hidden fees
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-w-md">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">What you get</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Unlimited conversations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Advanced customization</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Remove branding</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-3">Current Usage</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total conversations</span>
                      <span className="text-muted-foreground">{conversationCount} / 100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((conversationCount / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    {conversationCount >= 100 && (
                      <p className="text-xs text-orange-600 mt-1">
                        You&apos;ve reached your conversation limit. Upgrade to Pro for unlimited conversations.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center text-center py-16">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Security settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default OptimizedSettings;

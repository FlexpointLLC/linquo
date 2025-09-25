"use client";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Building2, Palette, Shield, CreditCard } from "lucide-react";
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
  conversationCount: number;
  lastLoaded: number | null;
} = {
  personalInfo: null,
  organizationInfo: null,
  conversationCount: 0,
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
    password: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleUpgradeClick = () => {
    toast.info("🚀 Upgrade feature coming soon!", {
      description: "We're working on bringing you premium features and billing management.",
      duration: 3000,
    });
  };

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
      console.log('📊 Cached conversation count:', settingsCache.conversationCount);
      setPersonalInfo(settingsCache.personalInfo);
      setOrganizationInfo(settingsCache.organizationInfo);
      setConversationCount(settingsCache.conversationCount);
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
      console.log('📊 Conversation count loaded:', totalConversations);

      // Update cache and state
      settingsCache = {
        personalInfo: agentResult.data,
        organizationInfo: orgData,
        conversationCount: totalConversations,
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
  }, [loadData]); // Include loadData dependency

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

  // Change password function
  const changePassword = useCallback(async () => {
    // Clear previous errors
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Validate required fields
    let hasErrors = false;
    if (!passwordForm.currentPassword) {
      setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is required' }));
      hasErrors = true;
    }
    if (!passwordForm.newPassword) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'New password is required' }));
      hasErrors = true;
    }
    if (!passwordForm.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your new password' }));
      hasErrors = true;
    }
    if (hasErrors) return;

    // Validate password match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      return;
    }

    setSaving(prev => ({ ...prev, password: true }));
    
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: personalInfo?.email || '',
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
        return;
      }

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        if (error.message.includes('auth')) {
          setPasswordErrors(prev => ({ ...prev, currentPassword: 'Authentication failed. Please try again.' }));
        } else if (error.message.includes('password')) {
          setPasswordErrors(prev => ({ ...prev, newPassword: error.message }));
        } else {
          throw error;
        }
        return;
      }

      toast.success("Password updated successfully!");
      
      // Clear the form and errors
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(prev => ({ ...prev, password: false }));
    }
  }, [passwordForm, personalInfo?.email]);

  // Delete account function
  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation !== 'DELETE' || !deletePassword) return;
    
    setDeleting(true);
    setDeleteError('');
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      // First verify user's session and password
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError) {
        setDeleteError('Please sign in again to delete your account');
        return;
      }
      if (!user) {
        setDeleteError('You must be signed in to delete your account');
        return;
      }

      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: personalInfo?.email || '',
        password: deletePassword
      });

      if (signInError) {
        setDeleteError('Incorrect password. Please try again.');
        return;
      }

      // Delete agent record first
      const { error: agentError } = await supabase
        .from("agents")
        .delete()
        .eq("id", personalInfo?.id)
        .eq("user_id", user.id); // Extra safety check

      if (agentError) {
        if (agentError.code === "42501") { // Permission denied
          setDeleteError('You do not have permission to delete this account');
        } else if (agentError.code === "23503") { // Foreign key violation
          setDeleteError('Please delete all associated data first');
        } else {
          setDeleteError(agentError.message || 'Failed to delete account data');
        }
        return;
      }

      // Delete auth user
      const { error: deleteUserError } = await supabase.auth.updateUser({
        password: crypto.randomUUID() // Set a random password to prevent login
      });

      if (deleteUserError) {
        setDeleteError('Failed to secure account. Please contact support.');
        return;
      }

      // Sign out
      await supabase.auth.signOut();

      // Show success message and redirect
      toast.success("Account deleted successfully");
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirmation, deletePassword, personalInfo]);

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
          <TabsTrigger value="general" className="flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="widget" className="flex items-center justify-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">Widget Settings</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center justify-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
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
                {/* Mobile Layout */}
                <div className="md:hidden space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Only</span>
                      <span className="text-2xl font-bold">$2</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>
                  
                  <div>
                    <Button size="lg" className="w-full" onClick={handleUpgradeClick}>
                      Upgrade Now
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Cancel anytime • No hidden fees
                    </p>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
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
                      <Button size="lg" className="w-48" onClick={handleUpgradeClick}>
                        Upgrade Now
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cancel anytime • No hidden fees
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-md">
                    <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">What you get</h4>
                  </div>
                </div>

                <div className="space-y-3 max-w-md md:max-w-full">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground md:hidden">What you get</h4>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password Section */}
              <div>
                <h3 className="text-lg font-semibold mb-1">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your account password to keep your account secure.
                </p>
                
                <div className="max-w-md space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                        setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                      }}
                      className={passwordErrors.currentPassword ? "border-red-500" : ""}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                        setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                      }}
                      className={passwordErrors.newPassword ? "border-red-500" : ""}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                        setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      className="w-full" 
                      onClick={changePassword}
                      disabled={saving.password}
                    >
                      {saving.password ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Security Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>
                
                <div className="space-y-4">
                  {/* Two-Factor Authentication - Desktop */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Enable 2FA
                      </Button>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                  </div>

                  {/* Two-Factor Authentication - Mobile */}
                  <div className="md:hidden space-y-3">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled className="w-full">
                      Enable 2FA
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Coming soon</p>
                  </div>
                  
                  {/* Login Sessions - Desktop */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Login Sessions</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage your active login sessions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        View Sessions
                      </Button>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                  </div>

                  {/* Login Sessions - Mobile */}
                  <div className="md:hidden space-y-3">
                    <div className="space-y-0.5">
                      <Label className="text-base">Login Sessions</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled className="w-full">
                      View Sessions
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Coming soon</p>
                  </div>
                  
                  {/* Account Deletion - Desktop */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Account Deletion</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and data
                      </p>
                    </div>
                    <Dialog onOpenChange={(open) => {
                      if (!open) {
                        setDeleteConfirmation('');
                        setDeletePassword('');
                        setDeleteError('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Account</DialogTitle>
                          <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="deletePassword" className="text-sm">Enter your password</Label>
                            <Input
                              id="deletePassword"
                              type="password"
                              placeholder="Enter your password to confirm"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                            />
                          </div>

                          <div className="p-4" style={{ backgroundColor: 'oklch(0.21 0 0)', borderRadius: 'calc(var(--radius) - 0px)' }}>
                            <div className="text-sm font-medium text-white">
                              Type <span className="font-mono text-red-400">DELETE</span> to confirm
                            </div>
                            <Input
                              className="mt-2 bg-transparent border-white/20 text-white placeholder:text-white/50"
                              placeholder="Type DELETE to confirm"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                            />
                          </div>
                          
                          {deleteError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                              <div className="text-sm">{deleteError}</div>
                            </div>
                          )}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <DialogClose asChild>
                            <Button variant="ghost">
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            disabled={deleteConfirmation !== 'DELETE' || deleting}
                            onClick={handleDeleteAccount}
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete Account'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Account Deletion - Mobile */}
                  <div className="md:hidden space-y-3">
                    <div className="space-y-0.5">
                      <Label className="text-base">Account Deletion</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and data
                      </p>
                    </div>
                    <Dialog onOpenChange={(open) => {
                      if (!open) {
                        setDeleteConfirmation('');
                        setDeletePassword('');
                        setDeleteError('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full">
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Account</DialogTitle>
                          <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="deletePasswordMobile" className="text-sm">Enter your password</Label>
                            <Input
                              id="deletePasswordMobile"
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              placeholder="Enter your password"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="deleteConfirmationMobile" className="text-sm">Type DELETE to confirm</Label>
                            <div className="p-3 bg-oklch(0.21_0_0) rounded-md border">
                              <Input
                                id="deleteConfirmationMobile"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Type DELETE"
                                className="bg-transparent border-0 p-0 text-white placeholder:text-gray-400 focus:ring-0"
                              />
                            </div>
                          </div>
                          
                          {deleteError && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                              {deleteError}
                            </div>
                          )}
                        </div>
                        
                        <DialogFooter className="gap-2 sm:gap-0">
                          <DialogClose asChild>
                            <Button variant="ghost">
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            disabled={deleteConfirmation !== 'DELETE' || deleting}
                            onClick={handleDeleteAccount}
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete Account'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default OptimizedSettings;

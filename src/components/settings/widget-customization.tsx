"use client";

import { useState, useEffect } from "react";
import { Palette, Save, Loader2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { WidgetPreview } from "./widget-preview";

export function WidgetCustomization() {
  const { organization, loading } = useAuth();
  const [customization, setCustomization] = useState({
    primaryColor: "#3B82F6",
    textLine1: "Hello there",
    textLine2: "How can we help?",
    iconAlignment: "right" as "left" | "right",
    showBranding: true,
    chatHeaderName: "Support Team",
    chatHeaderSubtitle: "Typically replies within 1 min",
    buttonText: "Start Chat",
  });
  const [originalCustomization, setOriginalCustomization] = useState({
    primaryColor: "#3B82F6",
    textLine1: "Hello there",
    textLine2: "How can we help?",
    iconAlignment: "right" as "left" | "right",
    showBranding: true,
    chatHeaderName: "Support Team",
    chatHeaderSubtitle: "Typically replies within 1 min",
    buttonText: "Start Chat",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const orgId = organization?.id;

  // Fetch widget settings from organization data
  useEffect(() => {
    if (organization) {
      const newCustomization = {
        primaryColor: organization.brand_color || "#3B82F6",
        textLine1: organization.widget_text_line1 || "Hello there",
        textLine2: organization.widget_text_line2 || "How can we help?",
        iconAlignment: (organization.widget_icon_alignment as "left" | "right") || "right",
        showBranding: organization.widget_show_branding !== false, // default to true
        chatHeaderName: organization.chat_header_name || "Support Team",
        chatHeaderSubtitle: organization.chat_header_subtitle || "Typically replies within 1 min",
        buttonText: organization.widget_button_text || "Start Chat",
      };
      setCustomization(newCustomization);
      setOriginalCustomization(newCustomization);
    }
  }, [organization]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(customization) !== JSON.stringify(originalCustomization);
    setHasUnsavedChanges(hasChanges);
  }, [customization, originalCustomization]);

  const handleCustomizationChange = (key: string, value: string | boolean) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save all widget settings
  const saveWidgetSettings = async () => {
    if (!orgId) return;
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const supabase = getSupabaseBrowser();
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { error } = await supabase
        .from('organizations')
        .update({ 
          brand_color: customization.primaryColor,
          widget_text_line1: customization.textLine1,
          widget_text_line2: customization.textLine2,
          widget_icon_alignment: customization.iconAlignment,
          widget_show_branding: customization.showBranding,
          chat_header_name: customization.chatHeaderName,
          chat_header_subtitle: customization.chatHeaderSubtitle,
          widget_button_text: customization.buttonText,
        })
        .eq('id', orgId);

      if (error) {
        throw error;
      }

      setOriginalCustomization(customization);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving widget settings:', error);
      setSaveError('Failed to save widget settings. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Widget Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Widget Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">You need to be part of an organization to customize widget settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Customization Controls */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Widget Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand Color */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Brand Color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customization.primaryColor}
                  onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  type="text"
                  value={customization.primaryColor}
                  onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* Text Lines */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Welcome Messages
              </Label>
              <div className="space-y-3">
                <Input
                  value={customization.textLine1}
                  onChange={(e) => handleCustomizationChange('textLine1', e.target.value)}
                  placeholder="First welcome message..."
                  className="w-full"
                />
                <Input
                  value={customization.textLine2}
                  onChange={(e) => handleCustomizationChange('textLine2', e.target.value)}
                  placeholder="Second welcome message..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Button Text */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Button Text
              </Label>
              <Input
                value={customization.buttonText}
                onChange={(e) => handleCustomizationChange('buttonText', e.target.value)}
                placeholder="Start Chat"
                className="w-full"
              />
            </div>

            {/* Icon Alignment */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Icon Alignment
              </Label>
              <Select
                value={customization.iconAlignment}
                onValueChange={(value) => handleCustomizationChange('iconAlignment', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Powered by Linquo */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show &quot;Powered by Linquo&quot; branding</Label>
                <div className="text-muted-foreground" style={{ fontSize: '12px' }}>Display our branding on your widget</div>
              </div>
              <Switch
                checked={customization.showBranding}
                onCheckedChange={(checked) => handleCustomizationChange('showBranding', checked)}
              />
            </div>

            {/* Chat Header */}
            <div className="pt-4 border-t border-border">
              <Label className="block text-sm font-medium text-foreground mb-2">
                Chat Header
              </Label>
              <div className="space-y-3">
                <Input
                  value={customization.chatHeaderName}
                  onChange={(e) => handleCustomizationChange('chatHeaderName', e.target.value)}
                  placeholder="Support Team"
                  className="w-full"
                />
                <Input
                  value={customization.chatHeaderSubtitle}
                  onChange={(e) => handleCustomizationChange('chatHeaderSubtitle', e.target.value)}
                  placeholder="Typically replies within 1 min"
                  className="w-full"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button 
                onClick={saveWidgetSettings}
                disabled={!hasUnsavedChanges || isSaving}
                className="w-full"
              >
                {isSaving ? (
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
              
              {saveSuccess && (
                <p className="mt-2 text-sm text-green-600 text-center">✅ Widget settings saved successfully!</p>
              )}
              {saveError && (
                <p className="mt-2 text-sm text-red-600 text-center">❌ {saveError}</p>
              )}
              {hasUnsavedChanges && (
                <p className="mt-2 text-sm text-orange-600 text-center">⚠️ You have unsaved changes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Widget Customization Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2">🎨 Widget Customization</h3>
          <p className="text-amber-800 text-sm">
            Customize your widget appearance including colors, welcome messages, icon alignment, and branding. Changes are saved to your organization and will be applied to all embedded widgets.
          </p>
        </div>
      </div>

      {/* Right Side - Live Preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WidgetPreview
              brandColor={customization.primaryColor}
              textLine1={customization.textLine1}
              textLine2={customization.textLine2}
              iconAlignment={customization.iconAlignment}
              showPoweredBy={customization.showBranding}
              chatHeaderName={customization.chatHeaderName}
              chatHeaderSubtitle={customization.chatHeaderSubtitle}
              buttonText={customization.buttonText}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

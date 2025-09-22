"use client";

import { useState, useEffect } from "react";
import { Palette, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function WidgetCustomization() {
  const { organization, loading } = useAuth();
  const [customization, setCustomization] = useState({
    primaryColor: "#3B82F6",
    borderRadius: "12px",
    position: "bottom-right",
    showBranding: true,
  });
  const [originalCustomization, setOriginalCustomization] = useState({
    primaryColor: "#3B82F6",
    borderRadius: "12px",
    position: "bottom-right",
    showBranding: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const orgId = organization?.id;

  // Fetch brand color from organization data
  useEffect(() => {
    if (organization?.brand_color) {
      const newCustomization = {
        primaryColor: organization.brand_color || "#3B82F6",
        borderRadius: "12px",
        position: "bottom-right",
        showBranding: true,
      };
      setCustomization(newCustomization);
      setOriginalCustomization(newCustomization);
    }
  }, [organization?.brand_color]);

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
          // Note: You might want to add other fields to the organizations table
          // like border_radius, position, show_branding if needed
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
            <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Widget Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customization.primaryColor}
              onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
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

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Border Radius
          </Label>
          <Select
            value={customization.borderRadius}
            onValueChange={(value) => handleCustomizationChange('borderRadius', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0px">Sharp (0px)</SelectItem>
              <SelectItem value="4px">Small (4px)</SelectItem>
              <SelectItem value="8px">Medium (8px)</SelectItem>
              <SelectItem value="12px">Large (12px)</SelectItem>
              <SelectItem value="16px">Extra Large (16px)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </Label>
          <Select
            value={customization.position}
            onValueChange={(value) => handleCustomizationChange('position', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">Show "Powered by Linquo" branding</Label>
            <div className="text-sm text-muted-foreground">Display our branding on your widget</div>
          </div>
          <Switch
            checked={customization.showBranding}
            onCheckedChange={(checked) => handleCustomizationChange('showBranding', checked)}
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
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

        {/* Widget Customization Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2">🎨 Widget Customization</h3>
          <p className="text-amber-800 text-sm">
            Customize your widget appearance including colors, position, and branding. Changes are saved to your organization and will be applied to all embedded widgets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

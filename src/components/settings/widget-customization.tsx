"use client";

import { useState, useEffect } from "react";
import { Palette, Save, Loader2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { WidgetPreview } from "./widget-preview";
import { toast } from "sonner";

type WidgetSettings = {
  id: string;
  brand_color: string;
  widget_text_line1: string;
  widget_text_line2: string;
  widget_icon_alignment: "left" | "right";
  widget_show_branding: boolean;
  chat_header_name: string;
  chat_header_subtitle: string;
  widget_button_text: string;
};

export function WidgetCustomization() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load widget settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase client not available");

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get agent's organization
        const { data: agent, error: agentError } = await supabase
          .from("agents")
          .select("org_id")
          .eq("user_id", user.id)
          .single();

        if (agentError) throw agentError;
        if (!agent) throw new Error("Agent not found");

        // Get organization settings
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select(`
            id,
            brand_color,
            widget_text_line1,
            widget_text_line2,
            widget_icon_alignment,
            widget_show_branding,
            chat_header_name,
            chat_header_subtitle,
            widget_button_text
          `)
          .eq("id", agent.org_id)
          .single();

        if (orgError) throw orgError;
        if (!org) throw new Error("Organization not found");

        setSettings({
          id: org.id,
          brand_color: org.brand_color || "#3B82F6",
          widget_text_line1: org.widget_text_line1 || "Hello there",
          widget_text_line2: org.widget_text_line2 || "How can we help?",
          widget_icon_alignment: org.widget_icon_alignment || "right",
          widget_show_branding: org.widget_show_branding ?? true,
          chat_header_name: org.chat_header_name || "Support Team",
          chat_header_subtitle: org.chat_header_subtitle || "Typically replies within 1 min",
          widget_button_text: org.widget_button_text || "Start Chat"
        });
      } catch (error) {
        console.error("Error loading widget settings:", error);
        toast.error("Failed to load widget settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          brand_color: settings.brand_color,
          widget_text_line1: settings.widget_text_line1,
          widget_text_line2: settings.widget_text_line2,
          widget_icon_alignment: settings.widget_icon_alignment,
          widget_show_branding: settings.widget_show_branding,
          chat_header_name: settings.chat_header_name,
          chat_header_subtitle: settings.chat_header_subtitle,
          widget_button_text: settings.widget_button_text,
          updated_at: new Date().toISOString()
        })
        .eq("id", settings.id);

      if (updateError) throw updateError;

      // Verify update
      const { data: updated, error: verifyError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", settings.id)
        .single();

      if (verifyError) throw verifyError;
      if (!updated) throw new Error("Failed to verify update");

      setSettings({
        ...settings,
        brand_color: updated.brand_color,
        widget_text_line1: updated.widget_text_line1,
        widget_text_line2: updated.widget_text_line2,
        widget_icon_alignment: updated.widget_icon_alignment,
        widget_show_branding: updated.widget_show_branding,
        chat_header_name: updated.chat_header_name,
        chat_header_subtitle: updated.chat_header_subtitle,
        widget_button_text: updated.widget_button_text
      });

      toast.success("Widget settings updated successfully!");
    } catch (error) {
      console.error("Error saving widget settings:", error);
      toast.error("Failed to save widget settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load widget settings. Please refresh the page.
      </div>
    );
  }

  return (
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
              <Label htmlFor="brandColor">Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="brandColor"
                  type="color"
                  value={settings.brand_color}
                  onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.brand_color}
                  onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="textLine1">Welcome Message (Line 1)</Label>
              <Input
                id="textLine1"
                value={settings.widget_text_line1}
                onChange={(e) => setSettings({ ...settings, widget_text_line1: e.target.value })}
                placeholder="Hello there"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="textLine2">Welcome Message (Line 2)</Label>
              <Input
                id="textLine2"
                value={settings.widget_text_line2}
                onChange={(e) => setSettings({ ...settings, widget_text_line2: e.target.value })}
                placeholder="How can we help?"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="iconAlignment">Icon Alignment</Label>
              <Select
                value={settings.widget_icon_alignment}
                onValueChange={(value: "left" | "right") => setSettings({ ...settings, widget_icon_alignment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Branding</Label>
                <p className="text-sm text-muted-foreground">Display "Powered by Linquo" in widget</p>
              </div>
              <Switch
                checked={settings.widget_show_branding}
                onCheckedChange={(checked) => setSettings({ ...settings, widget_show_branding: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Header</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="headerName">Header Name</Label>
              <Input
                id="headerName"
                value={settings.chat_header_name}
                onChange={(e) => setSettings({ ...settings, chat_header_name: e.target.value })}
                placeholder="Support Team"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="headerSubtitle">Header Subtitle</Label>
              <Input
                id="headerSubtitle"
                value={settings.chat_header_subtitle}
                onChange={(e) => setSettings({ ...settings, chat_header_subtitle: e.target.value })}
                placeholder="Typically replies within 1 min"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={settings.widget_button_text}
                onChange={(e) => setSettings({ ...settings, widget_button_text: e.target.value })}
                placeholder="Start Chat"
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
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
      </div>

      <div className="lg:sticky lg:top-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Widget Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WidgetPreview
              brandColor={settings.brand_color}
              textLine1={settings.widget_text_line1}
              textLine2={settings.widget_text_line2}
              iconAlignment={settings.widget_icon_alignment}
              showPoweredBy={settings.widget_show_branding}
              chatHeaderName={settings.chat_header_name}
              chatHeaderSubtitle={settings.chat_header_subtitle}
              buttonText={settings.widget_button_text}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
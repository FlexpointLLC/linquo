"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

type Settings = {
  companyName: string;
  defaultChannel: string;
  notifications: boolean;
};

const STORAGE_KEY = "ic_settings_v1";

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "",
    defaultChannel: "email",
    notifications: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Settings saved");
  }

  return (
    <div className="grid md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Default channel</Label>
            <Select
              value={settings.defaultChannel}
              onValueChange={(v) => setSettings({ ...settings, defaultChannel: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable notifications</div>
              <div className="text-sm text-muted-foreground">Get alerts for new messages</div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
            />
          </div>
          <div className="pt-2">
            <Button onClick={save}>Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Paste this snippet into your site&apos;s &lt;head&gt; to show the chat widget.
          </div>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
{`<script async src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`}
          </pre>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const code = `<script async src="${window.location.origin}/widget.js"></script>`;
                navigator.clipboard.writeText(code);
                toast.success("Embed code copied");
              }}
            >
              Copy code
            </Button>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            Works on HTML, React, Webflow, Framer—any platform where you can add a script in the head.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



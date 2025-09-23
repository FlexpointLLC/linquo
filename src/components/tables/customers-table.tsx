import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Globe, Monitor, Smartphone, Tablet } from "lucide-react";

type Customer = { 
  id: string; 
  display_name: string; 
  email: string; 
  status: "ACTIVE" | "BLOCKED"; 
  country?: string; 
  created_at: string;
  
  // Device & Browser Information
  browser_name?: string;
  os_name?: string;
  device_type?: 'Desktop' | 'Mobile' | 'Tablet';
  
  // Location Information
  city?: string;
  region?: string;
  
  // Behavioral Data
  is_returning?: boolean;
  total_visits?: number;
};

export function CustomersTable({ data }: { data: Customer[] }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Customers</h1>
        <p className="text-muted-foreground">
          View and manage your customer base and their conversation history
        </p>
      </div>
      
      <div className="bg-card rounded-lg border border-border">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Customer</TableHead>
          <TableHead className="px-4">Device & Location</TableHead>
          <TableHead className="px-4">Behavior</TableHead>
          <TableHead className="px-4">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 px-4">
              <div className="text-muted-foreground">
                <div className="text-sm">No customers yet</div>
                <div className="text-xs mt-1">Customers will appear here when they start conversations</div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="px-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {c.display_name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">{c.display_name}</div>
                    <div className="text-sm text-muted-foreground">{c.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {c.device_type === 'Mobile' && <Smartphone className="h-4 w-4 text-blue-500" />}
                    {c.device_type === 'Tablet' && <Tablet className="h-4 w-4 text-green-500" />}
                    {c.device_type === 'Desktop' && <Monitor className="h-4 w-4 text-purple-500" />}
                    <span className="text-sm text-foreground">
                      {c.browser_name} on {c.os_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {c.city && c.region ? `${c.city}, ${c.region}` : c.country || 'Unknown'}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="space-y-1">
                  <Badge 
                    variant={c.is_returning ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {c.is_returning ? 'Returning' : 'New'}
                  </Badge>
                  {c.total_visits && c.total_visits > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {c.total_visits} visits
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="text-sm text-foreground">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
        </Table>
      </div>
    </div>
  );
}



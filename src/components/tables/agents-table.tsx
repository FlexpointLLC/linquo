import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Agent = { id: string; display_name: string; email: string; online_status: string; is_active: boolean };

export function AgentsTable({ data }: { data: Agent[] }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Agents</h1>
        <p className="text-muted-foreground">
          Manage your team members and their access to the dashboard
        </p>
      </div>
      
      <div className="bg-card rounded-lg border border-border">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Agent</TableHead>
          <TableHead className="px-4">Email</TableHead>
          <TableHead className="px-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8 px-4">
              <div className="text-muted-foreground">
                <div className="text-sm">No agents yet</div>
                <div className="text-xs mt-1">Invite team members to get started</div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="flex items-center gap-2 px-4">
                <Avatar className="h-6 w-6"><AvatarFallback>{a.display_name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                {a.display_name}
              </TableCell>
              <TableCell className="px-4">{a.email}</TableCell>
              <TableCell className="px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  a.is_active 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>
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



import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Agent = { id: string; display_name: string; email: string; online_status: string };

export function AgentsTable({ data }: { data: Agent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              <div className="text-muted-foreground">
                <div className="text-sm">No agents yet</div>
                <div className="text-xs mt-1">Invite team members to get started</div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-6 w-6"><AvatarFallback>{a.display_name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                {a.display_name}
              </TableCell>
              <TableCell>{a.email}</TableCell>
              <TableCell className="capitalize">{a.online_status.toLowerCase()}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}



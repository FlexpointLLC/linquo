import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Agent = { id: string; name: string; email: string; role: string };

export function AgentsTable({ data }: { data: Agent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="flex items-center gap-2">
              <Avatar className="h-6 w-6"><AvatarFallback>{a.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
              {a.name}
            </TableCell>
            <TableCell>{a.email}</TableCell>
            <TableCell>{a.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}



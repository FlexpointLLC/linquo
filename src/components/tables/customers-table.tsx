import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Customer = { id: string; display_name: string; email: string; status: "ACTIVE" | "BLOCKED"; country?: string };

export function CustomersTable({ data }: { data: Customer[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              <div className="text-muted-foreground">
                <div className="text-sm">No customers yet</div>
                <div className="text-xs mt-1">Customers will appear here when they start conversations</div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.display_name}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell className="capitalize">{c.status}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}



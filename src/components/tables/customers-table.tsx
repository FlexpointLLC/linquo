import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Customer = { id: string; display_name: string; email: string; status: "ACTIVE" | "BLOCKED"; country?: string; created_at: string };

export function CustomersTable({ data }: { data: Customer[] }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
        <p className="text-gray-600">
          View and manage your customer base and their conversation history
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Name</TableHead>
          <TableHead className="px-4">Email</TableHead>
          <TableHead className="px-4">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8 px-4">
              <div className="text-muted-foreground">
                <div className="text-sm">No customers yet</div>
                <div className="text-xs mt-1">Customers will appear here when they start conversations</div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="px-4">{c.display_name}</TableCell>
              <TableCell className="px-4">{c.email}</TableCell>
              <TableCell className="px-4">
                {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
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



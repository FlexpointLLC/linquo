import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Customer = { id: string; name: string; email: string; status: "active" | "solved" | "churned" | "trial" };

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
        {data.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{c.name}</TableCell>
            <TableCell>{c.email}</TableCell>
            <TableCell className="capitalize">{c.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}



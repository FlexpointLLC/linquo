import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Agent = { id: string; display_name: string; email: string; online_status: string; is_active: boolean; role?: string };

export function AgentsTable({ data }: { data: Agent[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT"
  });
  const { agent, organization } = useAuth();

  // Frontend check: Find current user in the data array and check their role
  const currentUserInData = data.find(a => a.email === agent?.email);
  const isCurrentUserOwner = currentUserInData?.role === 'OWNER';

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "AGENT" });
    setEditingAgent(null);
  };

  const handleEdit = (agentToEdit: Agent) => {
    setEditingAgent(agentToEdit);
    setFormData({
      name: agentToEdit.display_name,
      email: agentToEdit.email,
      password: "",
      role: agentToEdit.role || "AGENT"
    });
    setIsOpen(true);
  };

  const handleDelete = (agentToDelete: Agent) => {
    setAgentToDelete(agentToDelete);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        toast.error("Database connection failed");
        return;
      }

      // Delete agent record
      const { error: agentError } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentToDelete.id);

      if (agentError) {
        toast.error(`Failed to delete agent: ${agentError.message}`);
        return;
      }

      toast.success("Agent deleted successfully!");
      setDeleteConfirmOpen(false);
      setAgentToDelete(null);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent?.org_id || !organization?.id) {
      toast.error("Organization not found");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        toast.error("Database connection failed");
        return;
      }

      if (editingAgent) {
        // Update existing agent
        const { error: agentError } = await supabase
          .from("agents")
          .update({
            display_name: formData.name,
            email: formData.email,
            role: formData.role
          })
          .eq("id", editingAgent.id);

        if (agentError) {
          toast.error(`Failed to update agent: ${agentError.message}`);
          return;
        }

        toast.success("Agent updated successfully!");
        setIsOpen(false);
        resetForm();
        window.location.reload();
      } else {
        // Create new agent
        // Store current user session
        const { data: currentSession } = await supabase.auth.getSession();
        const currentUser = currentSession?.session?.user;

        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              display_name: formData.name
            }
          }
        });

        if (authError) {
          toast.error(`Failed to create account: ${authError.message}`);
          return;
        }

        if (!authData.user) {
          toast.error("Failed to create user account");
          return;
        }

        // Create agent record
        const { error: agentError } = await supabase
          .from("agents")
          .insert({
            user_id: authData.user.id,
            display_name: formData.name,
            email: formData.email,
            org_id: agent.org_id,
            online_status: "OFFLINE",
            is_active: true,
            role: formData.role
          });

        if (agentError) {
          toast.error(`Failed to create agent: ${agentError.message}`);
          return;
        }

        // Re-authenticate the original user if we have their session
        if (currentUser) {
          await supabase.auth.signOut();
          // Note: We can't re-authenticate without the password, so we'll let the user know
          toast.success("Agent created successfully! Please refresh the page.");
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.success("Agent created successfully!");
          window.location.reload();
        }

        setIsOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error with agent:", error);
      toast.error(editingAgent ? "Failed to update agent" : "Failed to create agent");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Agents</h1>
          <p className="text-muted-foreground">
            Manage your team members and their access to the dashboard
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter agent name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              {!editingAgent && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter login password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Agent</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{agentToDelete?.display_name}</strong>? 
                This action cannot be undone and will remove all their data.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDelete}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-card rounded-lg border border-border">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Agent</TableHead>
          <TableHead className="px-4">Email</TableHead>
          <TableHead className="px-4">Role</TableHead>
          <TableHead className="px-4">Status</TableHead>
          {isCurrentUserOwner && <TableHead className="px-4 w-12">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isCurrentUserOwner ? 5 : 4} className="text-center py-8 px-4">
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
                  a.role === 'OWNER' 
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' 
                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {a.role || 'AGENT'}
                </span>
              </TableCell>
              <TableCell className="px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  a.is_active 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              {isCurrentUserOwner && (
                <TableCell className="px-4">
                  {a.email !== agent?.email && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(a)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(a)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
        </Table>
      </div>
    </div>
  );
}



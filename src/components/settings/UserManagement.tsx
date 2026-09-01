import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, MoreHorizontal, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import {
  listTeam,
  inviteUser,
  resendInvite,
  revokeInvite,
  updateUserRole,
  type AppRole,
  type TeamInvite,
  type TeamUser,
} from "@/lib/auth.functions";

const ROLE_LABELS: Record<AppRole, string> = { admin: "Admin", manager: "Inventory Manager", requestor: "Requestor" };
const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-primary/15 text-primary border-primary/20",
  manager: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  requestor: "bg-muted text-muted-foreground border-border",
};

export function UserManagement() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("requestor");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await listTeam();
      setUsers(res.users);
      setInvites(res.invites);
    } catch {
      toast.error("Could not load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const adminCount = users.filter((u) => u.role === "admin").length;

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("Valid email required");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setInviteError("User already exists");
      return;
    }
    setInviteLoading(true);
    const res = await inviteUser({ data: { email, role: inviteRole } });
    setInviteLoading(false);
    if (!res.ok) {
      setInviteError(res.error ?? "Could not send invitation");
      return;
    }
    toast.success(`Invitation sent to ${email}`);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("requestor");
    setInviteError("");
    void load();
  };

  const handleRoleChange = async (user: TeamUser, role: AppRole) => {
    const res = await updateUserRole({ data: { userId: user.id, role } });
    if (!res.ok) {
      toast.error(res.error ?? "Could not update role");
      return;
    }
    toast.success(`${user.displayName || user.email} is now ${ROLE_LABELS[role]}`);
    void load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="pl-9" />
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite user
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Invite a teammate to get started." />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const isLastAdmin = u.role === "admin" && adminCount <= 1;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.role ? ROLE_COLORS[u.role] : ""}>
                        {u.role ? ROLE_LABELS[u.role] : "No role"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="User actions" disabled={isSelf || isLastAdmin}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(["admin", "manager", "requestor"] as AppRole[])
                            .filter((r) => r !== u.role)
                            .map((r) => (
                              <DropdownMenuItem key={r} onClick={() => handleRoleChange(u, r)}>
                                Make {ROLE_LABELS[r]}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
          <div className="rounded-lg border border-border divide-y divide-border">
            {pendingInvites.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm">
                  <span className="font-medium">{i.email}</span>
                  <Badge variant="outline" className={`ml-2 ${ROLE_COLORS[i.role]}`}>{ROLE_LABELS[i.role]}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const res = await resendInvite({ data: { email: i.email } });
                      res.ok ? toast.success("Invitation resent") : toast.error(res.error ?? "Failed");
                    }}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const res = await revokeInvite({ data: { id: i.id } });
                      if (!res.ok) return toast.error(res.error ?? "Failed");
                      toast.success("Invitation revoked");
                      void load();
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>They'll receive an email invitation to join this workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                placeholder="teammate@company.com"
              />
              {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="requestor">Requestor</SelectItem>
                  <SelectItem value="manager">Inventory Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

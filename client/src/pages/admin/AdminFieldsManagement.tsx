import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FieldsConfig } from "@shared/schema";

export default function AdminFieldsManagement() {
  const { currentUser, userData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedField, setSelectedField] = useState<FieldsConfig | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldParentId, setNewFieldParentId] = useState<string | null>(null);
  const [newFieldEnabled, setNewFieldEnabled] = useState(true);
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldEnabled, setEditFieldEnabled] = useState(true);

  const { data: fields = [], isLoading } = useQuery<FieldsConfig[]>({
    queryKey: ["/api/fields"],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: { name: string; parentId: string | null; isMainField: boolean; enabled: boolean }) => {
      return apiRequest("POST", "/api/admin/fields", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      setIsAddDialogOpen(false);
      setNewFieldName("");
      setNewFieldParentId(null);
      setNewFieldEnabled(true);
      toast({
        title: "Field Created",
        description: "The field has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FieldsConfig> }) => {
      return apiRequest("PATCH", `/api/admin/fields/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      setIsEditDialogOpen(false);
      setSelectedField(null);
      toast({
        title: "Field Updated",
        description: "The field has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      setIsDeleteDialogOpen(false);
      setSelectedField(null);
      toast({
        title: "Field Deleted",
        description: "The field has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mainFields = fields.filter((f) => f.isMainField);
  const subFields = fields.filter((f) => !f.isMainField);

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    createFieldMutation.mutate({
      name: newFieldName.trim(),
      parentId: newFieldParentId,
      isMainField: !newFieldParentId,
      enabled: newFieldEnabled,
    });
  };

  const handleEditField = () => {
    if (!selectedField || !editFieldName.trim()) return;
    updateFieldMutation.mutate({
      id: selectedField.id,
      data: {
        name: editFieldName.trim(),
        enabled: editFieldEnabled,
      },
    });
  };

  const handleDeleteField = () => {
    if (!selectedField) return;
    deleteFieldMutation.mutate(selectedField.id);
  };

  const openEditDialog = (field: FieldsConfig) => {
    setSelectedField(field);
    setEditFieldName(field.name);
    setEditFieldEnabled(field.enabled);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (field: FieldsConfig) => {
    setSelectedField(field);
    setIsDeleteDialogOpen(true);
  };

  if (!currentUser || !userData?.roles?.admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Fields Management</h1>
            <p className="text-muted-foreground">Manage professional fields and sub-fields for dropdowns</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Main Fields
                </CardTitle>
                <CardDescription>Primary professional fields (e.g., Electrical, Mechanical, Civil)</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setNewFieldParentId(null);
                  setIsAddDialogOpen(true);
                }}
                data-testid="button-add-main-field"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : mainFields.length === 0 ? (
                <p className="text-muted-foreground">No main fields configured yet.</p>
              ) : (
                <div className="space-y-2">
                  {mainFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`field-item-${field.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.name}</span>
                        <Badge variant={field.enabled ? "default" : "secondary"}>
                          {field.enabled ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {subFields.filter((s) => s.parentId === field.id).length} sub-fields
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(field)}
                          data-testid={`button-edit-field-${field.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(field)}
                          data-testid={`button-delete-field-${field.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5" />
                  Sub-Fields
                </CardTitle>
                <CardDescription>Specializations under main fields</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setNewFieldParentId(mainFields[0]?.id || null);
                  setIsAddDialogOpen(true);
                }}
                disabled={mainFields.length === 0}
                data-testid="button-add-sub-field"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-Field
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : subFields.length === 0 ? (
                <p className="text-muted-foreground">No sub-fields configured yet.</p>
              ) : (
                <div className="space-y-4">
                  {mainFields.map((mainField) => {
                    const subs = subFields.filter((s) => s.parentId === mainField.id);
                    if (subs.length === 0) return null;
                    return (
                      <div key={mainField.id}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{mainField.name}</h4>
                        <div className="space-y-2">
                          {subs.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-3 border rounded-md ml-4"
                              data-testid={`subfield-item-${sub.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{sub.name}</span>
                                <Badge variant={sub.enabled ? "default" : "secondary"}>
                                  {sub.enabled ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(sub)}
                                  data-testid={`button-edit-subfield-${sub.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(sub)}
                                  data-testid={`button-delete-subfield-${sub.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{newFieldParentId ? "Add Sub-Field" : "Add Main Field"}</DialogTitle>
              <DialogDescription>
                {newFieldParentId
                  ? "Create a new specialization under a main field"
                  : "Create a new primary professional field"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fieldName">Field Name</Label>
                <Input
                  id="fieldName"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Enter field name"
                  data-testid="input-field-name"
                />
              </div>
              {mainFields.length > 0 && (
                <div>
                  <Label htmlFor="parentField">Parent Field (leave empty for main field)</Label>
                  <Select
                    value={newFieldParentId || "none"}
                    onValueChange={(v) => setNewFieldParentId(v === "none" ? null : v)}
                  >
                    <SelectTrigger data-testid="select-parent-field">
                      <SelectValue placeholder="Select parent field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Main Field)</SelectItem>
                      {mainFields.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="fieldEnabled"
                  checked={newFieldEnabled}
                  onCheckedChange={setNewFieldEnabled}
                  data-testid="switch-field-enabled"
                />
                <Label htmlFor="fieldEnabled">Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-add">
                Cancel
              </Button>
              <Button onClick={handleAddField} disabled={createFieldMutation.isPending} data-testid="button-confirm-add">
                {createFieldMutation.isPending ? "Creating..." : "Create Field"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Field</DialogTitle>
              <DialogDescription>Update the field details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFieldName">Field Name</Label>
                <Input
                  id="editFieldName"
                  value={editFieldName}
                  onChange={(e) => setEditFieldName(e.target.value)}
                  data-testid="input-edit-field-name"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="editFieldEnabled"
                  checked={editFieldEnabled}
                  onCheckedChange={setEditFieldEnabled}
                  data-testid="switch-edit-field-enabled"
                />
                <Label htmlFor="editFieldEnabled">Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleEditField} disabled={updateFieldMutation.isPending} data-testid="button-confirm-edit">
                {updateFieldMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Field</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedField?.name}"? This action cannot be undone.
                {selectedField?.isMainField && (
                  <span className="block mt-2 text-destructive">
                    Warning: Deleting a main field may affect associated sub-fields.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} data-testid="button-cancel-delete">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteField}
                disabled={deleteFieldMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteFieldMutation.isPending ? "Deleting..." : "Delete Field"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

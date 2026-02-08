'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'sonner';
import {
  GraduationCap,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface Program {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProgramFormData {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
}

const initialFormData: ProgramFormData = {
  name: '',
  displayName: '',
  description: '',
  isActive: true,
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/programs?includeInactive=${showInactive}`);
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      } else {
        toast.error('Failed to fetch programs');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleAddProgram = async () => {
    if (!formData.name || !formData.displayName) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Program created successfully');
        setIsAddDialogOpen(false);
        setFormData(initialFormData);
        fetchPrograms();
      } else {
        toast.error(data.error || 'Failed to create program');
      }
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Failed to create program');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProgram = async () => {
    if (!selectedProgram) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/programs/${selectedProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Program updated successfully');
        setIsEditDialogOpen(false);
        setSelectedProgram(null);
        setFormData(initialFormData);
        fetchPrograms();
      } else {
        toast.error(data.error || 'Failed to update program');
      }
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error('Failed to update program');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/programs/${selectedProgram.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        if (data.deactivated) {
          toast.success(data.message);
        } else {
          toast.success('Program deleted successfully');
        }
        setIsDeleteDialogOpen(false);
        setSelectedProgram(null);
        fetchPrograms();
      } else {
        toast.error(data.error || 'Failed to delete program');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      displayName: program.displayName,
      description: program.description || '',
      isActive: program.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (program: Program) => {
    setSelectedProgram(program);
    setIsDeleteDialogOpen(true);
  };

  const activeCount = programs.filter(p => p.isActive).length;
  const totalStudents = programs.reduce((sum, p) => sum + p.studentCount, 0);

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Programs
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage academic programs for student registration
          </p>
        </div>

        <Button
          onClick={() => {
            setFormData(initialFormData);
            setIsAddDialogOpen(true);
          }}
          className="bg-primary-600 text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary-600" />
              Total Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {programs.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Active Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={setShowInactive}
        />
        <Label htmlFor="show-inactive" className="text-sm text-gray-600 dark:text-gray-400">
          Show inactive programs
        </Label>
      </div>

      {/* Programs Table */}
      <Card className="bg-white dark:bg-gray-900 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">All Programs</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            A list of all academic programs in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No programs found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get started by adding your first academic program
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Program Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-mono font-medium">
                        {program.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {program.displayName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {program.description || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{program.studentCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(program)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(program)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Program Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Program</DialogTitle>
            <DialogDescription>
              Create a new academic program for student registration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Code *</Label>
              <Input
                id="name"
                placeholder="e.g., BSCS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                maxLength={20}
              />
              <p className="text-xs text-gray-500">Short code for the program (will be uppercase)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g., Bachelor of Science in Computer Science"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of the program..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProgram}
              disabled={submitting || !formData.name || !formData.displayName}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Program Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>
              Update the program details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Program Code *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., BSCS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Full Name *</Label>
              <Input
                id="edit-displayName"
                placeholder="e.g., Bachelor of Science in Computer Science"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description of the program..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProgram}
              disabled={submitting || !formData.name || !formData.displayName}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Program
            </DialogTitle>
            <DialogDescription>
              {selectedProgram?.studentCount ? (
                <>
                  This program has <strong>{selectedProgram.studentCount} students</strong> enrolled.
                  Deleting it will deactivate the program instead.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{selectedProgram?.name}</strong>?
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProgram}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : selectedProgram?.studentCount ? (
                'Deactivate'
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster richColors />
    </div>
  );
}

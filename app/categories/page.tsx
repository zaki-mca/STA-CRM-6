"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useCRM } from "@/contexts/crm-context"
import { Category } from "@/lib/types"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { FileUpload } from "@/components/file-upload"

export default function CategoriesPage() {
  const { data, addCategory, updateCategory, deleteCategory, refreshData } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [newCategory, setNewCategory] = useState<Partial<Category>>({ name: "" })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const filteredCategories = data.categories.filter(
    (category) => category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name) {
        toast.error("Category name is required")
        return
      }

      await addCategory(newCategory.name)
      toast.success("Category added successfully")
      setNewCategory({ name: "" })
      setShowAddDialog(false)
    } catch (error: any) {
      toast.error(`Failed to add category: ${error.message}`)
    }
  }

  const handleUpdateCategory = async () => {
    try {
      if (!editingCategory || !editingCategory.name) {
        toast.error("Category name is required")
        return
      }

      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description || ''
      })
      toast.success("Category updated successfully")
      setEditingCategory(null)
      setShowEditDialog(false)
    } catch (error: any) {
      toast.error(`Failed to update category: ${error.message}`)
    }
  }

  const handleDeleteCategory = async () => {
    try {
      if (!categoryToDelete) return

      await deleteCategory(categoryToDelete.id)
      toast.success("Category deleted successfully")
      setCategoryToDelete(null)
    } catch (error: any) {
      toast.error(`Failed to delete category: ${error.message}`)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Categories</h1>
        <p className="text-muted-foreground">Manage your product categories</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 w-full max-w-sm">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <FileUpload
            apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/categories/bulk-upload`}
            entityType="category"
            onUploadSuccess={(newCategories) => {
              if (newCategories.length === 0) {
                toast.info("No new categories were added", {
                  position: "top-right",
                  autoClose: 5000
                });
              } else {
                toast.success(
                  <div>
                    <p className="font-semibold mb-1">Successfully uploaded {newCategories.length} {newCategories.length === 1 ? 'category' : 'categories'}</p>
                    <ul className="list-disc pl-4 mt-1 text-sm max-h-32 overflow-auto">
                      {newCategories.slice(0, 5).map((category: { name: string }, idx: number) => (
                        <li key={idx}>{category.name}</li>
                      ))}
                      {newCategories.length > 5 && <li>...and {newCategories.length - 5} more</li>}
                    </ul>
                  </div>,
                  {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                  }
                );
              }
              
              const refreshPromise = refreshData();
              toast.promise(
                refreshPromise,
                {
                  pending: 'Updating categories list...',
                  success: 'Categories list refreshed successfully!',
                  error: 'Failed to refresh categories'
                },
                {
                  position: "top-right",
                  autoClose: 3000
                }
              );
            }}
          />

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddCategory}>Save Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Products Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => {
                  const productsCount = data.products.filter(
                    (product) => product.category && product.category.id === category.id
                  ).length

                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{productsCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category)
                              setShowEditDialog(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCategoryToDelete(category)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the category &quot;{category.name}&quot;.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteCategory}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No categories found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter category name"
                value={editingCategory?.name || ""}
                onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateCategory}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
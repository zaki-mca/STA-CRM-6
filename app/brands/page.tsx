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
import { Brand } from "@/lib/types"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { FileUpload } from "@/components/file-upload"

export default function BrandsPage() {
  const { data, addBrand, updateBrand, deleteBrand, refreshData } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [newBrand, setNewBrand] = useState<Partial<Brand>>({ name: "" })
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)

  const filteredBrands = data.brands.filter(
    (brand) => brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddBrand = async () => {
    try {
      if (!newBrand.name) {
        toast.error("Brand name is required")
        return
      }

      await addBrand(newBrand.name)
      toast.success("Brand added successfully")
      setNewBrand({ name: "" })
      setShowAddDialog(false)
    } catch (error: any) {
      toast.error(`Failed to add brand: ${error.message}`)
    }
  }

  const handleUpdateBrand = async () => {
    try {
      if (!editingBrand || !editingBrand.name) {
        toast.error("Brand name is required")
        return
      }

      await updateBrand(editingBrand.id, {
        name: editingBrand.name,
        description: editingBrand.description || ''
      })
      toast.success("Brand updated successfully")
      setEditingBrand(null)
      setShowEditDialog(false)
    } catch (error: any) {
      toast.error(`Failed to update brand: ${error.message}`)
    }
  }

  const handleDeleteBrand = async () => {
    try {
      if (!brandToDelete) return

      await deleteBrand(brandToDelete.id)
      toast.success("Brand deleted successfully")
      setBrandToDelete(null)
    } catch (error: any) {
      // Check for foreign key constraint error
      if (error.message && error.message.includes("referenced from table")) {
        const productsCount = data.products.filter(
          (product) => product.brand && product.brand.id === brandToDelete?.id
        ).length;
        
        toast.error(
          `Cannot delete this brand because it is used by ${productsCount} product(s). Please remove the brand from all products first.`
        );
      } else {
        toast.error(`Failed to delete brand: ${error.message}`);
      }
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Brands</h1>
        <p className="text-muted-foreground">Manage your product brands</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 w-full max-w-sm">
          <Input
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <FileUpload
            apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/brands/bulk-upload`}
            entityType="brand"
            onUploadSuccess={(newBrands) => {
              // Enhanced success message with more details using react-toastify
              if (newBrands.length === 0) {
                toast.info("No new brands were added", {
                  position: "top-right",
                  autoClose: 5000
                });
              } else {
                toast.success(
                  <div>
                    <p className="font-semibold mb-1">Successfully uploaded {newBrands.length} {newBrands.length === 1 ? 'brand' : 'brands'}</p>
                    <ul className="list-disc pl-4 mt-1 text-sm max-h-32 overflow-auto">
                      {newBrands.slice(0, 5).map((brand: { name: string }, idx: number) => (
                        <li key={idx}>{brand.name}</li>
                      ))}
                      {newBrands.length > 5 && <li>...and {newBrands.length - 5} more</li>}
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
              
              // Refresh data and notify when complete with react-toastify
              const refreshPromise = refreshData();
              toast.promise(
                refreshPromise,
                {
                  pending: 'Updating brands list...',
                  success: 'Brands list refreshed successfully!',
                  error: 'Failed to refresh brands'
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
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter brand name"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddBrand}>Save Brand</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBrands.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Products Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => {
                  const productsCount = data.products.filter(
                    (product) => product.brand && product.brand.id === brand.id
                  ).length

                  return (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>{productsCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBrand(brand)
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
                                onClick={() => setBrandToDelete(brand)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the brand &quot;{brand.name}&quot;.
                                  {productsCount > 0 && (
                                    <span className="mt-2 block text-amber-600">
                                      Warning: This brand is used by {productsCount} product(s).
                                      You must remove the brand from these products before deleting.
                                    </span>
                                  )}
                                  {productsCount === 0 && (
                                    <span className="block mt-2">This action cannot be undone.</span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setBrandToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteBrand}
                                  disabled={productsCount > 0}
                                >
                                  Delete
                                </AlertDialogAction>
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
              <p className="text-muted-foreground">No brands found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Brand Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Brand Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter brand name"
                value={editingBrand?.name || ""}
                onChange={(e) => setEditingBrand(editingBrand ? { ...editingBrand, name: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateBrand}>Update Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
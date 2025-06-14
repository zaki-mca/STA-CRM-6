"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Product } from "@/lib/types"
import { X, Printer, Save, RefreshCw, Download } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/lib/toast"
import Image from "next/image"
import { useTheme } from "next-themes"

interface ProductLabelModalProps {
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LabelSettings {
  showName: boolean
  showPrice: boolean
  showReference: boolean
  showBarcode: boolean
  showCategory: boolean
  showBrand: boolean
  showLogo: boolean
  columns: number
  fontSize: number
  padding: number
  template: 'standard' | 'compact' | 'detailed'
  pageSize: 'a4' | 'letter'
}

export function ProductLabelModal({ products, open, onOpenChange }: ProductLabelModalProps) {
  const [settings, setSettings] = useState<LabelSettings>({
    showName: true,
    showPrice: true,
    showReference: true,
    showBarcode: true,
    showCategory: false,
    showBrand: false,
    showLogo: true,
    columns: 3,
    fontSize: 10,
    padding: 5,
    template: 'standard',
    pageSize: 'a4'
  })

  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("preview")

  const printRef = useRef<HTMLDivElement>(null)

  // Generate EAN-13 barcode display
  const createEanBarcode = (text: string, width: number, height: number): string => {
    // Ensure we have a valid EAN-13 string (13 digits)
    // If not, pad with zeros or use a default pattern
    let eanCode = text.replace(/\D/g, '').substring(0, 13);
    while (eanCode.length < 13) {
      eanCode = '0' + eanCode;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Fill with white
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = 2;
      const leftMargin = 10;
      let xPos = leftMargin;
      
      // Draw start pattern (101)
      ctx.fillStyle = 'black';
      ctx.fillRect(xPos, 0, barWidth, height - 15);
      xPos += barWidth * 2;
      ctx.fillRect(xPos, 0, barWidth, height - 15);
      xPos += barWidth * 2;
      
      // Draw data bars based on EAN-13 encoding
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(eanCode[i]);
        
        // Simple pattern for visualization (not actual EAN-13 encoding)
        for (let j = 0; j < 4; j++) {
          if ((digit + j) % 2 === 0) {
            ctx.fillRect(xPos, 0, barWidth, height - 15);
          }
          xPos += barWidth;
        }
        
        // Add middle separator after 6th digit
        if (i === 5) {
          xPos += barWidth;
          ctx.fillRect(xPos, 0, barWidth, height - 15);
          xPos += barWidth * 2;
          ctx.fillRect(xPos, 0, barWidth, height - 15);
          xPos += barWidth * 2;
        }
      }
      
      // Draw end pattern (101)
      ctx.fillRect(xPos, 0, barWidth, height - 15);
      xPos += barWidth * 2;
      ctx.fillRect(xPos, 0, barWidth, height - 15);
      
      // Add text below barcode
      ctx.font = '10px Arial';
      ctx.fillText(eanCode, width / 2 - 30, height - 5);
    }
    
    return canvas.toDataURL('image/png');
  }

  // Simple print function
  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current;
    
    const printStyles = `
      @page { size: ${settings.pageSize}; margin: 10mm; }
      body { font-family: Arial, sans-serif; background-color: white; color: black; }
      .label-grid { 
        display: grid;
        grid-template-columns: repeat(${settings.columns}, 1fr);
        gap: 8px;
        padding: 0;
      }
      .label-item {
        border: 1px solid #ccc;
        padding: ${settings.padding}px;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .label-logo {
        margin-bottom: 5px;
        text-align: center;
      }
      .label-name {
        font-weight: bold;
        font-size: ${settings.fontSize + 2}px;
        margin-bottom: 3px;
        text-align: center;
      }
      .label-ref {
        font-size: ${settings.fontSize}px;
        margin-bottom: 2px;
      }
      .label-price {
        font-size: ${settings.fontSize}px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      .label-category, .label-brand {
        font-size: ${settings.fontSize - 2}px;
        margin-bottom: 1px;
      }
      .label-barcode {
        margin-top: 5px;
        text-align: center;
      }
    `;
    
    // Create print window content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print labels');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Product Labels</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="label-grid">
            ${Array.from(printContent.querySelectorAll('.label-item')).map(node => node.outerHTML).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: settings.pageSize
    }) as any

    const pageWidth = settings.pageSize === 'a4' ? 210 : 216
    const pageHeight = settings.pageSize === 'a4' ? 297 : 279
    const margin = 10
    const availableWidth = pageWidth - 2 * margin
    const labelWidth = availableWidth / settings.columns
    
    let x = margin
    let y = margin
    const rowHeight = 30 + (settings.showBarcode ? 15 : 0) + (settings.showCategory || settings.showBrand ? 5 : 0)
    
    // Add logo image to document for reuse
    let logoHeight = 0;
    if (settings.showLogo) {
      try {
        const logoData = '/STA-LOGO.webp';
        const logoWidth = labelWidth * 0.6;
        logoHeight = 10; // Approximate logo height in mm
        
        doc.addImage('/STA-LOGO.webp', 'WEBP', 0, 0, 10, 10); // Add to document resources
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }

    products.forEach((product, index) => {
      // Add border
      doc.rect(x, y, labelWidth - 2, rowHeight - 2, 'S')
      
      // Add content
      let contentY = y + 5
      
      // Add logo at top center if enabled
      if (settings.showLogo) {
        try {
          const logoWidth = labelWidth * 0.6;
          doc.addImage('/STA-LOGO.webp', 'WEBP', x + (labelWidth - 2 - logoWidth) / 2, contentY, logoWidth, logoHeight);
          contentY += logoHeight + 2;
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      if (settings.showName) {
        doc.setFontSize(settings.fontSize + 2)
        doc.text(product.name, x + labelWidth / 2, contentY, { align: 'center' })
        contentY += 7
      }
      
      if (settings.showReference) {
        doc.setFontSize(settings.fontSize)
        doc.text(`Ref: ${product.reference || 'N/A'}`, x + 3, contentY)
        contentY += 5
      }
      
      if (settings.showPrice) {
        doc.setFontSize(settings.fontSize + 2)
        doc.setFont(undefined, 'bold')
        doc.text(`${product.sellPrice.toFixed(2)} DZD`, x + 3, contentY)
        doc.setFont(undefined, 'normal')
        contentY += 5
      }
      
      if (settings.showCategory) {
        doc.setFontSize(settings.fontSize - 2)
        doc.text(`Cat: ${product.category?.name || 'Uncategorized'}`, x + 3, contentY)
        contentY += 4
      }
      
      if (settings.showBrand) {
        doc.setFontSize(settings.fontSize - 2)
        doc.text(`Brand: ${product.brand?.name || 'Unbranded'}`, x + 3, contentY)
        contentY += 4
      }
      
      if (settings.showBarcode) {
        // In a real implementation, you would use a proper barcode library
        // This is just a placeholder
        doc.setFontSize(8)
        doc.text(`*${product.id.substring(0, 10)}*`, x + labelWidth / 2, contentY, { align: 'center' })
      }
      
      // Move to next position
      x += labelWidth
      if (x + labelWidth > pageWidth - margin) {
        x = margin
        y += rowHeight
        if (y + rowHeight > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
      }
    })
    
    doc.save('product-labels.pdf')
    
    toast.success("Labels exported successfully", {
      position: "top-right", 
      autoClose: 3000
    })
  }
  
  const applyTemplate = (template: 'standard' | 'compact' | 'detailed') => {
    if (template === 'standard') {
      setSettings(prev => ({
        ...prev,
        showName: true,
        showPrice: true,
        showReference: true,
        showBarcode: true,
        showLogo: true,
        showCategory: false,
        showBrand: false,
        columns: 3,
        fontSize: 10,
        padding: 5,
        template
      }))
    } else if (template === 'compact') {
      setSettings(prev => ({
        ...prev,
        showName: true,
        showPrice: true,
        showReference: false,
        showBarcode: true,
        showLogo: false,
        showCategory: false,
        showBrand: false,
        columns: 4,
        fontSize: 8,
        padding: 3,
        template
      }))
    } else if (template === 'detailed') {
      setSettings(prev => ({
        ...prev,
        showName: true,
        showPrice: true,
        showReference: true,
        showBarcode: true,
        showLogo: true,
        showCategory: true,
        showBrand: true,
        columns: 2,
        fontSize: 12,
        padding: 8,
        template
      }))
    }
  }

  // Apply template when it changes
  useEffect(() => {
    applyTemplate(settings.template)
  }, [settings.template])

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Product Labels</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Label Settings</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Previewing {products.length} product labels</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
              <div ref={printRef}>
                <div 
                  className="grid gap-2 label-grid" 
                  style={{ 
                    gridTemplateColumns: `repeat(${settings.columns}, 1fr)`,
                  }}
                >
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="border rounded p-2 flex flex-col label-item"
                      style={{ padding: `${settings.padding}px` }}
                    >
                      {settings.showLogo && (
                        <div className="flex justify-center mb-2 label-logo">
                          <Image
                            src="/STA-LOGO.webp"
                            alt="STA Logo"
                            width={80}
                            height={30}
                            className="h-auto"
                          />
                        </div>
                      )}
                      
                      {settings.showName && (
                        <h3 className="font-bold text-center label-name text-black dark:text-white" style={{ fontSize: `${settings.fontSize + 2}px` }}>
                          {product.name}
                        </h3>
                      )}
                      
                      {settings.showReference && (
                        <p className="text-sm label-ref text-black dark:text-white" style={{ fontSize: `${settings.fontSize}px` }}>
                          Ref: {product.reference || 'N/A'}
                        </p>
                      )}
                      
                      {settings.showPrice && (
                        <p className="font-medium label-price text-black dark:text-white" style={{ fontSize: `${settings.fontSize}px` }}>
                          Price: {product.sellPrice.toFixed(2)} DZD
                        </p>
                      )}
                      
                      {settings.showCategory && product.category && (
                        <p className="text-xs label-category text-gray-600 dark:text-gray-300" style={{ fontSize: `${settings.fontSize - 2}px` }}>
                          Category: {product.category.name || 'Uncategorized'}
                        </p>
                      )}
                      
                      {settings.showBrand && product.brand && (
                        <p className="text-xs label-brand text-gray-600 dark:text-gray-300" style={{ fontSize: `${settings.fontSize - 2}px` }}>
                          Brand: {product.brand.name || 'Unbranded'}
                        </p>
                      )}
                      
                      {settings.showBarcode && (
                        <div className="mt-2 label-barcode">
                          <img 
                            src={createEanBarcode(product.id || '0000000000000', 100, 40)}
                            alt="EAN Barcode"
                            className="w-full max-w-[120px] mx-auto h-auto"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Content Options</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showLogo">Show Logo</Label>
                  <Switch 
                    id="showLogo" 
                    checked={settings.showLogo}
                    onCheckedChange={(checked) => handleSettingChange("showLogo", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showName">Show Product Name</Label>
                  <Switch 
                    id="showName" 
                    checked={settings.showName}
                    onCheckedChange={(checked) => handleSettingChange("showName", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showPrice">Show Price</Label>
                  <Switch 
                    id="showPrice" 
                    checked={settings.showPrice}
                    onCheckedChange={(checked) => handleSettingChange("showPrice", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showReference">Show Reference</Label>
                  <Switch 
                    id="showReference" 
                    checked={settings.showReference}
                    onCheckedChange={(checked) => handleSettingChange("showReference", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showBarcode">Show Barcode</Label>
                  <Switch 
                    id="showBarcode" 
                    checked={settings.showBarcode}
                    onCheckedChange={(checked) => handleSettingChange("showBarcode", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showCategory">Show Category</Label>
                  <Switch 
                    id="showCategory" 
                    checked={settings.showCategory}
                    onCheckedChange={(checked) => handleSettingChange("showCategory", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showBrand">Show Brand</Label>
                  <Switch 
                    id="showBrand" 
                    checked={settings.showBrand}
                    onCheckedChange={(checked) => handleSettingChange("showBrand", checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Layout Options</h3>
                
                <div className="space-y-2">
                  <Label>Columns per row</Label>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={settings.columns.toString()}
                      onValueChange={(value) => handleSettingChange("columns", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Columns" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Font Size: {settings.fontSize}px</Label>
                  <Slider
                    min={6}
                    max={16}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(value) => handleSettingChange("fontSize", value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Padding: {settings.padding}px</Label>
                  <Slider
                    min={0}
                    max={20}
                    step={1}
                    value={[settings.padding]}
                    onValueChange={(value) => handleSettingChange("padding", value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <Select 
                    value={settings.pageSize}
                    onValueChange={(value: 'a4' | 'letter') => handleSettingChange("pageSize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Page Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <h3 className="font-medium">Choose a Template</h3>
            <div className="grid grid-cols-3 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  settings.template === 'standard' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => applyTemplate('standard')}
              >
                <h4 className="font-medium">Standard</h4>
                <p className="text-sm text-gray-500">
                  Shows name, price, reference, logo and barcode. 3 columns per page.
                </p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  settings.template === 'compact' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => applyTemplate('compact')}
              >
                <h4 className="font-medium">Compact</h4>
                <p className="text-sm text-gray-500">
                  Shows only name, price and barcode. Smaller size with 4 columns per page.
                </p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer ${
                  settings.template === 'detailed' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => applyTemplate('detailed')}
              >
                <h4 className="font-medium">Detailed</h4>
                <p className="text-sm text-gray-500">
                  Shows all details including logo, barcode, brand, and category. 2 columns per page.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

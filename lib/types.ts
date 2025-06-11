export interface Provider {
  id: string
  name: string
  email: string
  address: string
  phoneNumber: string
  createdAt: Date
}

export interface Client {
  id: string
  gender: "Mr." | "Ms." | "Mrs."
  firstName: string
  lastName: string
  email: string
  address: string
  phoneNumber: string
  birthDate: Date
  professionalDomain: string
  professionalDomainCode?: string
  revenue: number
  ccpAccount: string
  cle: string
  rip: string
  ripCle: string
  notes?: string
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt?: Date
}

export interface Brand {
  id: string
  name: string
  description?: string
  createdAt?: Date
}

export interface Product {
  id: string
  name: string
  description: string
  reference: string
  sku: string
  category: Category
  brand: Brand
  sellPrice: number
  buyPrice: number
  quantity: number
  createdAt: Date
}

export interface InvoiceItem {
  id: string
  product_id: string
  product_name: string
  product_description?: string
  reference?: string
  sku?: string
  category_id?: string
  category_name?: string
  brand_id?: string
  brand_name?: string
  quantity: number
  unit_price: number
  discount?: number
  total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  provider_id: string
  provider_name: string
  provider_email?: string
  provider_phone?: string
  provider_address?: string
  items: InvoiceItem[]
  subtotal: number
  total: number
  tax_rate?: number
  status: "draft" | "sent" | "paid" | "overdue"
  notes?: string
  date?: string
  due_date?: string
  created_at: string | Date
  updated_at?: string | Date
}

export interface ProfessionalDomain {
  id: string
  name: string
  description?: string
  paymentCode?: string
}

export interface OrderItem {
  id: string
  product: {
    id: string
    name: string
    description: string
    sellPrice: number
  }
  quantity: number
  unitPrice: number
  total: number
}

export interface Order {
  id: string
  orderNumber: string
  client: {
    id: string
    name: string
    email: string
    address: string
    phoneNumber: string
  }
  items: OrderItem[]
  subtotal: number
  total: number
  status: string
  orderDate: Date
  expectedDelivery: Date
  notes?: string
}

export interface CRMData {
  clients: Client[]
  providers: Provider[]
  products: Product[]
  invoices: Invoice[]
  orders: Order[]
  professionalDomains: ProfessionalDomain[]
  categories: Category[]
  brands: Brand[]
}

export interface CRMContextType {
  data: {
    clients: Client[];
    providers: Provider[];
    products: Product[];
    invoices: Invoice[];
    orders: Order[];
    professionalDomains: ProfessionalDomain[];
    categories: Category[];
    brands: Brand[];
  };
  loading: boolean;
  error: string | null;
  errorDetails: {
    status: number;
    message: string;
    timestamp: number;
  } | null;
  clearError: () => void;
  networkStatus: 'online' | 'offline';
  lastFetchTime: number;
  refreshData: () => Promise<void>;
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  addProvider: (provider: Omit<Provider, "id" | "createdAt">) => Promise<Provider>;
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<Product>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<Invoice>;
  addProfessionalDomain: (domain: Omit<ProfessionalDomain, "id">) => Promise<ProfessionalDomain>;
  addCategory: (name: string) => Promise<Category>;
  addBrand: (name: string) => Promise<Brand>;
  updateClient: (id: string, client: Partial<Client>) => Promise<Client>;
  updateProvider: (id: string, provider: Partial<Provider>) => Promise<Provider>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: "draft" | "sent" | "paid" | "overdue") => Promise<Invoice>;
  updateProfessionalDomain: (id: string, domain: Partial<ProfessionalDomain>) => Promise<ProfessionalDomain>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<Category>;
  updateBrand: (id: string, brand: Partial<Brand>) => Promise<Brand>;
  deleteClient: (id: string) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteProfessionalDomain: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
}

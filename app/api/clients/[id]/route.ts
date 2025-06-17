import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AppError, catchAsync, parseFormData } from '@/lib/api-utils';

// Type for the params containing client ID
type Params = {
  params: {
    id: string;
  }
}

// GET /api/clients/[id] - Get a specific client
export const GET = catchAsync(async (_: NextRequest, { params }: Params) => {
  const { id } = params;
  
  const result = await query(`
    SELECT 
      c.*,
      pd.name as professional_domain_name,
      pd.payment_code as professional_domain_code,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date)) as age
    FROM clients c
    LEFT JOIN professional_domains pd ON c.professional_domain_id = pd.id
    WHERE c.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('Client not found with this ID', 404);
  }
  
  // Ensure the client has all required fields
  const clientRow = result.rows[0];
  const client = {
    ...clientRow,
    // Ensure these fields are never null/undefined for the frontend
    first_name: clientRow.first_name || '',
    last_name: clientRow.last_name || '',
    gender: clientRow.gender || '',
    phone: clientRow.phone || '',
    address: clientRow.address || '',
    professional_domain_name: clientRow.professional_domain_name || '',
    professional_domain_code: clientRow.professional_domain_code || '',
    ccp_account: clientRow.ccp_account || '',
    cle: clientRow.cle || '',
    rip: clientRow.rip || '',
    rip_cle: clientRow.rip_cle || '',
    revenue: parseFloat(clientRow.revenue as string) || 0,
    age: clientRow.age || 0
  };
  
  return NextResponse.json({
    status: 'success',
    data: client
  });
});

// PUT /api/clients/[id] - Update a client
export const PUT = catchAsync(async (request: NextRequest, { params }: Params) => {
  const { id } = params;
  
  // Handle both JSON and FormData
  let data;
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    data = await request.json();
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    data = await parseFormData(formData);
  } else {
    throw new AppError('Unsupported media type', 415);
  }
  
  const { 
    first_name, last_name, gender, email, phone, address, 
    professional_domain_id, birth_date, ccp_account, cle,
    rip, rip_cle, revenue, notes, company, status
  } = data;
  
  // Validate that client exists
  const clientCheck = await query('SELECT id FROM clients WHERE id = $1', [id]);
  if (clientCheck.rows.length === 0) {
    throw new AppError('Client not found with this ID', 404);
  }
  
  // Create SQL query with all fields
  const result = await query(`
    UPDATE clients
    SET 
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      gender = COALESCE($3, gender),
      email = COALESCE($4, email),
      phone = COALESCE($5, phone),
      address = COALESCE($6, address),
      professional_domain_id = $7,
      birth_date = $8,
      ccp_account = COALESCE($9, ccp_account),
      cle = COALESCE($10, cle),
      rip = COALESCE($11, rip),
      rip_cle = COALESCE($12, rip_cle),
      revenue = COALESCE($13, revenue),
      notes = COALESCE($14, notes),
      company = COALESCE($15, company),
      status = COALESCE($16, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $17
    RETURNING *, 
      (SELECT name FROM professional_domains WHERE id = professional_domain_id) as professional_domain_name,
      (SELECT payment_code FROM professional_domains WHERE id = professional_domain_id) as professional_domain_code,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) as age
  `, [
    first_name, last_name, gender, email, phone, address, 
    professional_domain_id, birth_date, ccp_account, cle,
    rip, rip_cle, revenue, notes, company, status, id
  ]);
  
  return NextResponse.json({
    status: 'success',
    data: result.rows[0]
  });
});

// DELETE /api/clients/[id] - Delete a client
export const DELETE = catchAsync(async (_: NextRequest, { params }: Params) => {
  const { id } = params;
  
  // Check if client exists
  const clientCheck = await query('SELECT id FROM clients WHERE id = $1', [id]);
  if (clientCheck.rows.length === 0) {
    throw new AppError('Client not found with this ID', 404);
  }
  
  // Delete the client
  await query('DELETE FROM clients WHERE id = $1', [id]);
  
  return NextResponse.json({
    status: 'success',
    data: null
  });
}); 
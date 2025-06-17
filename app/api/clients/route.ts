import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { catchAsync, AppError, parseFormData } from '@/lib/api-utils';

// GET /api/clients - Get all clients
export const GET = catchAsync(async () => {
  const result = await query(`
    SELECT 
      c.*,
      pd.name as professional_domain_name,
      pd.payment_code as professional_domain_code,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date)) as age
    FROM clients c
    LEFT JOIN professional_domains pd ON c.professional_domain_id = pd.id
    ORDER BY c.created_at DESC
  `);
  
  // Ensure all clients have the required fields
  const clients = result.rows.map((client: any) => ({
    ...client,
    // Ensure these fields are never null/undefined for the frontend
    first_name: client.first_name || '',
    last_name: client.last_name || '',
    gender: client.gender || '',
    phone: client.phone || '',
    address: client.address || '',
    professional_domain_name: client.professional_domain_name || '',
    professional_domain_code: client.professional_domain_code || '',
    ccp_account: client.ccp_account || '',
    cle: client.cle || '',
    rip: client.rip || '',
    rip_cle: client.rip_cle || '',
    revenue: parseFloat(client.revenue as string) || 0,
    age: client.age || 0
  }));
  
  return NextResponse.json({
    status: 'success',
    results: clients.length,
    data: clients
  });
});

// POST /api/clients - Create a new client
export const POST = catchAsync(async (request: NextRequest) => {
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
    rip, rip_cle, revenue, company, status, notes
  } = data;
  
  // Create SQL query with all fields
  const result = await query(`
    INSERT INTO clients (
      first_name, last_name, gender, email, phone, address, 
      professional_domain_id, birth_date, ccp_account, cle,
      rip, rip_cle, revenue, company, status, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *, 
      (SELECT name FROM professional_domains WHERE id = professional_domain_id) as professional_domain_name,
      (SELECT payment_code FROM professional_domains WHERE id = professional_domain_id) as professional_domain_code,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) as age
  `, [
    first_name || '', last_name || '', gender || '', email, phone || '', address || '', 
    professional_domain_id, birth_date, ccp_account || '', cle || '',
    rip || '', rip_cle || '', revenue || 0, company || '', status || 'active', notes || ''
  ]);
  
  return NextResponse.json({
    status: 'success',
    data: result.rows[0]
  }, { status: 201 });
}); 
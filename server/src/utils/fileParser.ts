import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { parse as csvParse } from 'papaparse';

// Define the file type since Express.Multer is not recognized
interface UploadedFile {
  path: string;
  originalname: string;
}

export interface ParsedRecord {
  name: string;
  description?: string;
  paymentCode?: string; // for professional domains
}

export async function parseFile(file: UploadedFile): Promise<ParsedRecord[]> {
  const fileExt = file.originalname.split('.').pop()?.toLowerCase();
  
  if (!fileExt) {
    throw new Error('Invalid file: cannot determine file extension');
  }

  switch (fileExt) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'txt':
      return parseTXT(file);
    default:
      throw new Error('Unsupported file format. Please use CSV, XLS, XLSX, or TXT.');
  }
}

function parseCSV(file: UploadedFile): Promise<ParsedRecord[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedRecord[] = [];
    
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data: Record<string, any>) => {
        // Normalize column names to handle differently named columns
        const record: ParsedRecord = {
          name: data.name || data.Name || data.NAME || data.title || data.Title || '',
          description: data.description || data.Description || data.desc || '',
        };
        
        // Special handling for professional domains
        if (data.paymentCode || data.payment_code || data.code) {
          record.paymentCode = data.paymentCode || data.payment_code || data.code || '';
        }
        
        // Only add records with a name
        if (record.name) {
          results.push(record);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

function parseExcel(file: UploadedFile): Promise<ParsedRecord[]> {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet);
      
      const results: ParsedRecord[] = data.map((row: Record<string, any>) => {
        // Normalize column names to handle differently named columns
        const record: ParsedRecord = {
          name: row.name || row.Name || row.NAME || row.title || row.Title || '',
          description: row.description || row.Description || row.desc || '',
        };
        
        // Special handling for professional domains
        if (row.paymentCode || row.payment_code || row.code) {
          record.paymentCode = row.paymentCode || row.payment_code || row.code || '';
        }
        
        return record;
      }).filter((record: ParsedRecord) => record.name); // Only include records with a name
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

function parseTXT(file: UploadedFile): Promise<ParsedRecord[]> {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // Try to determine if it's CSV format first
      const csvResult = csvParse(content, { header: true, skipEmptyLines: true });
      
      if (csvResult.data && csvResult.data.length > 0 && 
          (csvResult.data[0] as any).name || (csvResult.data[0] as any).Name) {
        // It looks like a CSV format with headers
        const results: ParsedRecord[] = csvResult.data.map((row: any) => ({
          name: row.name || row.Name || row.NAME || row.title || row.Title || '',
          description: row.description || row.Description || row.desc || '',
          paymentCode: row.paymentCode || row.payment_code || row.code || '',
        })).filter((record: ParsedRecord) => record.name);
        
        resolve(results);
        return;
      }
      
      // Otherwise, treat as plain text with one item per line
      const lines = content.split('\n').filter(line => line.trim());
      const results: ParsedRecord[] = lines.map(line => ({
        name: line.trim(),
      }));
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
} 
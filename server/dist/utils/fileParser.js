"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFile = parseFile;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const exceljs_1 = __importDefault(require("exceljs"));
const papaparse_1 = require("papaparse");
async function parseFile(file) {
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
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs_1.default.createReadStream(file.path)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => {
            // Normalize column names to handle differently named columns
            const record = {
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
            .on('error', (error) => {
            reject(error);
        });
    });
}
async function parseExcel(file) {
    try {
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.readFile(file.path);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file');
        }
        const results = [];
        // Get header row to identify column names
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = (cell.value?.toString() || '').toLowerCase();
        });
        // Process each row
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return; // Skip header row
            const record = {
                name: '',
                description: '',
            };
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                const value = cell.value?.toString() || '';
                if (header.includes('name') || header.includes('title')) {
                    record.name = value;
                }
                else if (header.includes('desc')) {
                    record.description = value;
                }
                else if (header.includes('code') || header.includes('payment')) {
                    record.paymentCode = value;
                }
            });
            // Only add records with a name
            if (record.name) {
                results.push(record);
            }
        });
        return results;
    }
    catch (error) {
        throw error;
    }
}
function parseTXT(file) {
    return new Promise((resolve, reject) => {
        try {
            const content = fs_1.default.readFileSync(file.path, 'utf8');
            // Try to determine if it's CSV format first
            const csvResult = (0, papaparse_1.parse)(content, { header: true, skipEmptyLines: true });
            if (csvResult.data && csvResult.data.length > 0 &&
                csvResult.data[0].name || csvResult.data[0].Name) {
                // It looks like a CSV format with headers
                const results = csvResult.data.map((row) => ({
                    name: row.name || row.Name || row.NAME || row.title || row.Title || '',
                    description: row.description || row.Description || row.desc || '',
                    paymentCode: row.paymentCode || row.payment_code || row.code || '',
                })).filter((record) => record.name);
                resolve(results);
                return;
            }
            // Otherwise, treat as plain text with one item per line
            const lines = content.split('\n').filter(line => line.trim());
            const results = lines.map(line => ({
                name: line.trim(),
            }));
            resolve(results);
        }
        catch (error) {
            reject(error);
        }
    });
}
//# sourceMappingURL=fileParser.js.map
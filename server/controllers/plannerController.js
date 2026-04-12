const UserBudget = require('../models/userBudgetModel');
const multer = require('multer');
const Tesseract = require('tesseract.js');

const upload = multer({ storage: multer.memoryStorage() });
exports.uploadMiddleware = upload.single('receipt');

exports.getPlannerInfo = async (req, res) => {
    try {
        const budget = await UserBudget.get(req.user);
        res.json(budget || null);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving planner info' });
    }
};

exports.setPlannerInfo = async (req, res) => {
    try {
        const { salary, strategy_type, goals, allocations } = req.body;

        if (!salary || !strategy_type) {
            return res.status(400).json({ message: 'Salary and Strategy are required' });
        }

        const numericSalary = Number(salary);
        if (isNaN(numericSalary) || numericSalary <= 0) {
            return res.status(400).json({ message: 'Salary must be a valid positive number' });
        }

        const data = {
            salary: numericSalary,
            strategy_type,
            goals: goals || '',
            allocations: Array.isArray(allocations) ? allocations : []
        };

        const result = await UserBudget.upsert(req.user, data);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error saving planner info' });
    }
};

// -------------------------
// CATEGORY DETECTION
// -------------------------
function detectCategory(text) {
    const t = text.toLowerCase();

    const categoryKeywords = {
        'fuel':      ['diesel', 'petrol', 'fuel', 'indian oil', 'indianoil', 'bharat petroleum',
                      'hp petrol', 'nozzle', 'litre', 'ltr', 'density', 'preset type'],
        'groceries': ['grocery', 'groceries', 'supermarket', 'vegetables', 'fruits',
                      'dmart', 'reliance fresh', 'bigbasket', 'retail value', 'mrp',
                      'fssai', 'grand total', 'total units'],
        'food':      ['restaurant', 'cafe', 'hotel', 'food', 'pizza', 'burger',
                      'swiggy', 'zomato', 'dining', 'table no', 'covers'],
        'transport': ['uber', 'ola', 'taxi', 'auto', 'metro', 'bus', 'train', 'irctc', 'rapido'],
        'medical':   ['pharmacy', 'medical', 'hospital', 'clinic', 'doctor',
                      'medicine', 'apollo', 'chemist'],
        'shopping':  ['mall', 'amazon', 'flipkart', 'myntra', 'retail', 'store', 'shop'],
        'utilities': ['electricity', 'water bill', 'gas bill', 'broadband',
                      'internet', 'recharge', 'mobile bill'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => t.includes(kw))) {
            return category;
        }
    }

    return 'expense';
}

// -------------------------
// AMOUNT EXTRACTION
// -------------------------
function extractAmount(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const discountLinePattern = /discount|points|saving|\boff\b|cashback/i;

    // Helper: extract rightmost number from a line, with ₹-as-2 OCR artifact handling
    function getRightmostAmount(line, stripLeading2 = false) {
        const allNums = line.match(/\b\d[\d,]*\.?\d{0,2}\b/g);
        if (!allNums) return null;

        const raw = allNums[allNums.length - 1].replace(/,/g, '');
        const val = parseFloat(raw);
        if (isNaN(val) || val <= 0) return null;

        // If number starts with '2' and has 4+ chars, the '2' may be OCR'd ₹ symbol
        if (stripLeading2 && raw.startsWith('2') && raw.length >= 4) {
            const stripped = parseFloat(raw.slice(1));
            if (!isNaN(stripped) && stripped > 0) return stripped;
        }

        return val;
    }

    // Priority 1: GRAND TOTAL line — strip leading '2' as it's almost certainly ₹
    for (const line of lines) {
        if (/grand\s+total/i.test(line) && !discountLinePattern.test(line)) {
            const val = getRightmostAmount(line, true);
            if (val) return val;
        }
    }

    // Priority 2: Other high-confidence total/amount labels
    const priorityPatterns = [
        /net\s+(?:total|amount|payable)/i,
        /amount\s+payable/i,
        /bill\s+(?:total|amount)/i,
        /\bamount\b/i,
        /^total\s*[:\-]?\s*[\d₹2]/i,
    ];

    for (const pattern of priorityPatterns) {
        for (const line of lines) {
            if (!pattern.test(line)) continue;
            if (discountLinePattern.test(line)) continue;
            const val = getRightmostAmount(line, true);
            if (val) return val;
        }
    }

    // Priority 3: INR or Rs. prefix/suffix
    const inrMatch =
        text.match(/(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
        text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?)/i);
    if (inrMatch) {
        const val = parseFloat(inrMatch[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) return val;
    }

    // Priority 4: Fallback — skip metadata lines, pick largest plausible number
    const skipLinePattern = /\b(TXN|INVOICE|TIN|TEL|NO\.|RATE|DENSITY|VOLUME|RECEIPT|NOZZLE|FIP|PRESET|MOBILE|VEHICLE|DATE|TIME|CIN|GSTIN|FSSAI|ITEMS|UNITS|CUSTOMER|STORE)\b/i;
    const vehiclePattern  = /\b[A-Z]{2}\d{2}[A-Z]{2}\d+\b/i;

    const candidates = [];
    for (const line of lines) {
        if (vehiclePattern.test(line)) continue;
        if (skipLinePattern.test(line)) continue;
        if (discountLinePattern.test(line)) continue;

        const matches = line.match(/\b(\d{1,6}(?:\.\d{1,2})?)\b/g);
        if (matches) {
            matches.forEach(m => {
                const n = parseFloat(m);
                if (n > 0 && n < 100000) candidates.push(n);
            });
        }
    }

    if (candidates.length > 0) return Math.max(...candidates);
    return 0;
}

// -------------------------
// DATE EXTRACTION
// -------------------------
const MONTH_MAP = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function extractDate(text) {
    // Format 1: written date "07 Feb 2026" or "O07 Feb 2026" (OCR noise prefix)
    const writtenMatch = text.match(/\b([O0]?\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/);
    if (writtenMatch) {
        let [, day, monthStr, year] = writtenMatch;
        day = day.replace(/^O/i, '').replace(/^0+/, '') || '1';
        const month = MONTH_MAP[monthStr.slice(0, 3).toLowerCase()];
        const d = parseInt(day), y = parseInt(year);
        if (month && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
            return `${year}-${month}-${day.padStart(2, '0')}`;
        }
    }

    // Format 2: DD/MM/YYYY or DD-MM-YYYY
    const slashMatch = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
    if (slashMatch) {
        const [, day, month, year] = slashMatch;
        const d = parseInt(day), m = parseInt(month), y = parseInt(year);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
            return `${year}-${month}-${day}`;
        }
    }

    // Format 3: DD/MM/YY
    const shortMatch = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{2})\b/);
    if (shortMatch) {
        const [, day, month, year] = shortMatch;
        const d = parseInt(day), m = parseInt(month), y = parseInt('20' + year);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
            return `${y}-${month}-${day}`;
        }
    }

    // Format 4: OCR-merged like 13/0924
    const mergedMatch = text.match(/\b(\d{2})[\/\-](\d{2})(\d{2,4})\b/);
    if (mergedMatch) {
        let [, day, month, year] = mergedMatch;
        if (year.length === 2) year = '20' + year;
        const d = parseInt(day), m = parseInt(month), y = parseInt(year);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    return new Date().toISOString().split('T')[0];
}

// -------------------------
// MERCHANT EXTRACTION
// -------------------------
function extractMerchant(text) {
    const skipPatterns = [
        /^\s*[-=_#*•.~\s]+\s*$/,
        /^[^a-zA-Z]*$/,
        /\b(VAT|TIN|TXN|TEL|INVOICE|ORIGINAL|RECEIPT|NO\.|FIP|NOZZLE|PRESET|VEHICLE|MOBILE|DATE|TIME|DENSITY|RATE|VOLUME|PRODUCT|CIN|GSTIN|FSSAI|CUSTOMER|STORE|ITEMS|TOTAL|GRAND)\b/i,
        /welcomes?\s+you/i,
        /thank\s+you/i,
        /visit\s+again/i,
        /^\d[\d\s#*]+$/,
        /^[A-Z0-9]{10,}$/,
    ];

    function isNoiseLine(line) {
        const tokens = line.trim().split(/\s+/);
        const singleCharCount = tokens.filter(t => t.length === 1).length;
        return singleCharCount / tokens.length > 0.5;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Priority: extract STORE field value directly
    for (const line of lines) {
        const storeMatch = line.match(/\bSTORE\b[^a-zA-Z]*([A-Za-z].*)/i);
        if (storeMatch) {
            const name = storeMatch[1].replace(/[^a-zA-Z0-9\s]/g, '').trim();
            if (name.length > 2) return name;
        }
    }

    // Fallback: scan top lines for a clean merchant name
    const merchantLines = [];
    for (const line of lines.slice(0, 8)) {
        if (isNoiseLine(line)) continue;
        if (skipPatterns.some(p => p.test(line))) continue;

        const cleaned = line.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        if (cleaned.length < 3) continue;

        merchantLines.push(cleaned);
        if (merchantLines.length === 2) break;
    }

    return merchantLines.join(' ') || 'Unknown Merchant';
}

// -------------------------
// SCAN RECEIPT
// -------------------------
exports.scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No receipt image uploaded' });
        }

        console.log('Processing OCR...');

        const result = await Tesseract.recognize(
            req.file.buffer,
            'eng',
            { logger: m => console.log(m) }
        );

        const text = result.data.text;
        console.log('OCR TEXT:\n', text);

        const amount                = extractAmount(text);
        const date                  = extractDate(text);
        const merchant              = extractMerchant(text);
        const suggestedCategoryType = detectCategory(text);

        console.log('Parsed →', { merchant, amount, date, suggestedCategoryType });

        res.json({
            merchant,
            amount,
            date,
            suggestedCategoryType,
            note: 'OCR Scanned Receipt'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error scanning receipt' });
    }
};
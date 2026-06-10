import * as path from 'path';

/**
 * Thai font configuration สำหรับ pdfmake
 * ใช้ TH Sarabun New ที่รองรับภาษาไทยอย่างสมบูรณ์
 */
export function getThaiPdfFonts(): Record<string, Record<string, string>> {
  const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
  return {
    THSarabunNew: {
      normal: path.join(fontsDir, 'THSarabunNew.ttf'),
      bold: path.join(fontsDir, 'THSarabunNew-Bold.ttf'),
      italics: path.join(fontsDir, 'THSarabunNew.ttf'),
      bolditalics: path.join(fontsDir, 'THSarabunNew-Bold.ttf'),
    },
    // fallback ภาษาอังกฤษ
    Roboto: {
      normal: path.join(fontsDir, 'THSarabunNew.ttf'),
      bold: path.join(fontsDir, 'THSarabunNew-Bold.ttf'),
      italics: path.join(fontsDir, 'THSarabunNew.ttf'),
      bolditalics: path.join(fontsDir, 'THSarabunNew-Bold.ttf'),
    },
  };
}

/**
 * Default document style ที่รองรับภาษาไทย
 */
export function getThaiDocumentDefaults() {
  return {
    defaultStyle: {
      font: 'THSarabunNew',
      fontSize: 14,
    },
  };
}

/**
 * สไตล์มาตรฐานสำหรับ Green Sync PDF documents
 */
export function getGreenSyncPdfStyles(): Record<string, object> {
  return {
    header: {
      fontSize: 28,
      bold: true,
      color: '#16a34a',
      alignment: 'center',
    },
    subheader: {
      fontSize: 18,
      bold: true,
      color: '#374151',
    },
    orgName: {
      fontSize: 22,
      bold: true,
      color: '#111827',
      alignment: 'center',
    },
    level: {
      fontSize: 20,
      bold: true,
      color: '#d97706',
      alignment: 'center',
    },
    tableHeader: {
      bold: true,
      fontSize: 14,
      fillColor: '#f3f4f6',
      color: '#374151',
    },
    label: {
      fontSize: 13,
      color: '#6b7280',
    },
    value: {
      fontSize: 14,
      bold: true,
      color: '#111827',
    },
    footer: {
      fontSize: 11,
      color: '#9ca3af',
      alignment: 'center',
      italics: true,
    },
  };
}

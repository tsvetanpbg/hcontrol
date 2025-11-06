import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

// Lazy initialization of fonts - only run when actually needed
let fontsInitialized = false;

const initializeFonts = () => {
  if (!fontsInitialized && pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    fontsInitialized = true;
  }
};

const LOGO_URL = 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/logo-concept-1760425219928.png';
const WEBSITE_URL = 'https://hcontrol.bg';

interface DeviceReadings {
  device: {
    id: number;
    deviceName: string;
    deviceType: string;
    minTemp: number;
    maxTemp: number;
  };
  readings: Array<{
    hour: number;
    temperature: number;
    notes: string | null;
  }>;
}

// Helper to convert image URL to base64
const getBase64ImageFromURL = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return '';
  }
};

// Export all daily diaries to PDF
export const exportAllDailyDiariesToPDF = async (
  devicesData: DeviceReadings[],
  date: string,
  establishment?: string
) => {
  // Initialize fonts before use
  initializeFonts();
  
  const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
  
  // Group devices by type
  const devicesByType: Record<string, DeviceReadings[]> = {};
  devicesData.forEach(item => {
    if (!devicesByType[item.device.deviceType]) {
      devicesByType[item.device.deviceType] = [];
    }
    devicesByType[item.device.deviceType].push(item);
  });
  
  const typeOrder = ['Фризери', 'Хладилници', 'Топли витрини', 'Фритюрници'];
  
  const content: Content = [];
  
  // Add logo
  if (logoBase64) {
    content.push({
      image: logoBase64,
      width: 150,
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Add title
  content.push({
    text: 'Дневен отчет - Всички дневници',
    style: 'header',
    alignment: 'center',
    margin: [0, 0, 0, 5]
  });
  
  content.push({
    text: 'Фризери, Хладилници, Топли витрини, Фритюрници',
    style: 'subheader',
    alignment: 'center',
    margin: [0, 0, 0, 10]
  });
  
  // Add metadata
  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  if (establishment) {
    content.push({ text: `Обект: ${establishment}`, style: 'metadata' });
  }
  content.push({ text: `Дата: ${dateFormatted}`, style: 'metadata' });
  content.push({ 
    text: `Генериран: ${new Date().toLocaleString('bg-BG')}`, 
    style: 'metadata',
    margin: [0, 0, 0, 15]
  });
  
  // Add each device type section
  typeOrder.forEach((deviceType) => {
    if (!devicesByType[deviceType] || devicesByType[deviceType].length === 0) {
      return;
    }
    
    const devicesOfType = devicesByType[deviceType];
    
    // Device type header
    content.push({
      text: `ДНЕВНИК ${deviceType.toUpperCase()}`,
      style: 'sectionHeader',
      margin: [0, 10, 0, 10]
    });
    
    // Add each device
    devicesOfType.forEach((deviceData) => {
      const { device, readings } = deviceData;
      
      // Device name
      content.push({
        text: `${device.deviceName} (${device.minTemp}°C до ${device.maxTemp}°C)`,
        style: 'deviceName',
        margin: [0, 5, 0, 5]
      });
      
      // Table
      const tableBody = [
        [
          { text: 'Час', style: 'tableHeader' },
          { text: 'Температура', style: 'tableHeader' },
          { text: 'Бележки', style: 'tableHeader' }
        ]
      ];
      
      readings.forEach(reading => {
        tableBody.push([
          { text: `${reading.hour.toString().padStart(2, '0')}:00`, alignment: 'center' },
          { text: `${reading.temperature.toFixed(1)}°C`, alignment: 'center' },
          { text: reading.notes || '-', alignment: 'left' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: [60, 80, '*'],
          body: tableBody
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 ? '#475569' : (rowIndex % 2 === 0 ? '#f8fafc' : null);
          },
          hLineWidth: function () { return 0.5; },
          vLineWidth: function () { return 0.5; },
          hLineColor: function () { return '#e2e8f0'; },
          vLineColor: function () { return '#e2e8f0'; }
        },
        margin: [0, 0, 0, 10]
      });
    });
  });
  
  // Add footer
  content.push({
    text: [
      { text: 'Генерирано от H CONTROL\n', color: '#6b7280' },
      { text: WEBSITE_URL, color: '#0066cc', link: WEBSITE_URL }
    ],
    alignment: 'center',
    margin: [0, 20, 0, 0],
    fontSize: 9
  });
  
  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#111827'
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280'
      },
      metadata: {
        fontSize: 10,
        color: '#374151'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#ffffff',
        background: '#2563eb',
        fillColor: '#2563eb',
        alignment: 'left'
      },
      deviceName: {
        fontSize: 11,
        bold: true,
        fillColor: '#f0f2f5',
        background: '#f0f2f5'
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: '#ffffff',
        fillColor: '#475569',
        alignment: 'center'
      }
    },
    defaultStyle: {
      fontSize: 10
    },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    footer: function(currentPage, pageCount) {
      return {
        text: `Страница ${currentPage} от ${pageCount}`,
        alignment: 'center',
        fontSize: 9,
        color: '#6b7280',
        margin: [0, 10, 0, 0]
      };
    }
  };
  
  pdfMake.createPdf(docDefinition).download(`dnevnici-vsichki_${date}.pdf`);
};

// Export single temperature log to PDF
export const exportTemperatureLogsToPDF = async (
  deviceName: string,
  deviceType: string,
  readings: any[],
  date: string,
  establishment?: string
) => {
  // Initialize fonts before use
  initializeFonts();
  
  const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
  
  const content: Content = [];
  
  // Add logo
  if (logoBase64) {
    content.push({
      image: logoBase64,
      width: 150,
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Add title
  content.push({
    text: 'Температурен дневник',
    style: 'header',
    alignment: 'center',
    margin: [0, 0, 0, 5]
  });
  
  content.push({
    text: `${deviceType} - ${deviceName}`,
    style: 'subheader',
    alignment: 'center',
    margin: [0, 0, 0, 10]
  });
  
  // Add metadata
  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  if (establishment) {
    content.push({ text: `Обект: ${establishment}`, style: 'metadata' });
  }
  content.push({ text: `Дата: ${dateFormatted}`, style: 'metadata' });
  content.push({ 
    text: `Генериран: ${new Date().toLocaleString('bg-BG')}`, 
    style: 'metadata',
    margin: [0, 0, 0, 15]
  });
  
  // Table
  const tableBody = [
    [
      { text: 'Час', style: 'tableHeader' },
      { text: 'Температура', style: 'tableHeader' },
      { text: 'Бележки', style: 'tableHeader' }
    ]
  ];
  
  readings.forEach(reading => {
    tableBody.push([
      { text: `${reading.hour.toString().padStart(2, '0')}:00`, alignment: 'center' },
      { text: `${reading.temperature.toFixed(1)}°C`, alignment: 'center' },
      { text: reading.notes || '-', alignment: 'left' }
    ]);
  });
  
  content.push({
    table: {
      headerRows: 1,
      widths: [80, 100, '*'],
      body: tableBody
    },
    layout: {
      fillColor: function (rowIndex) {
        return rowIndex === 0 ? '#2563eb' : (rowIndex % 2 === 0 ? '#f5f7fa' : null);
      },
      hLineWidth: function () { return 0.5; },
      vLineWidth: function () { return 0.5; },
      hLineColor: function () { return '#e2e8f0'; },
      vLineColor: function () { return '#e2e8f0'; }
    },
    margin: [0, 0, 0, 10]
  });
  
  // Add footer
  content.push({
    text: [
      { text: 'Генерирано от H CONTROL\n', color: '#6b7280' },
      { text: WEBSITE_URL, color: '#0066cc', link: WEBSITE_URL }
    ],
    alignment: 'center',
    margin: [0, 20, 0, 0],
    fontSize: 9
  });
  
  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#111827'
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280'
      },
      metadata: {
        fontSize: 10,
        color: '#374151'
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: '#ffffff',
        fillColor: '#2563eb',
        alignment: 'center'
      }
    },
    defaultStyle: {
      fontSize: 10
    },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    footer: function(currentPage, pageCount) {
      return {
        text: `Страница ${currentPage} от ${pageCount}`,
        alignment: 'center',
        fontSize: 9,
        color: '#6b7280',
        margin: [0, 10, 0, 0]
      };
    }
  };
  
  pdfMake.createPdf(docDefinition).download(`${deviceName}_${date}.pdf`);
};

// Export food diary to PDF
export const exportFoodDiaryToPDF = async (
  entries: any[],
  startDate: string,
  endDate: string,
  establishment?: string
) => {
  // Initialize fonts before use
  initializeFonts();
  
  const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
  
  const content: Content = [];
  
  // Add logo
  if (logoBase64) {
    content.push({
      image: logoBase64,
      width: 150,
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Add title
  content.push({
    text: 'Дневник Храни',
    style: 'header',
    alignment: 'center',
    margin: [0, 0, 0, 5]
  });
  
  content.push({
    text: 'Автоматично генерирани записи',
    style: 'subheader',
    alignment: 'center',
    margin: [0, 0, 0, 10]
  });
  
  // Add metadata
  const dateRange = startDate === endDate 
    ? new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : `${new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG')} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('bg-BG')}`;
  
  if (establishment) {
    content.push({ text: `Обект: ${establishment}`, style: 'metadata' });
  }
  content.push({ text: `Период: ${dateRange}`, style: 'metadata' });
  content.push({ 
    text: `Генериран: ${new Date().toLocaleString('bg-BG')}`, 
    style: 'metadata',
    margin: [0, 0, 0, 15]
  });
  
  // Group entries by date
  const groupedEntries: Record<string, any[]> = {};
  entries.forEach(entry => {
    if (!groupedEntries[entry.date]) {
      groupedEntries[entry.date] = [];
    }
    groupedEntries[entry.date].push(entry);
  });
  
  // Add entries for each date
  Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a)).forEach((date) => {
    const dateEntries = groupedEntries[date].sort((a, b) => a.time.localeCompare(b.time));
    
    // Date header
    content.push({
      text: new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      style: 'dateHeader',
      margin: [0, 10, 0, 5]
    });
    
    // Table
    const tableBody = [
      [
        { text: 'Час', style: 'tableHeader' },
        { text: 'Храна', style: 'tableHeader' },
        { text: 'Количество', style: 'tableHeader' },
        { text: 'Температура', style: 'tableHeader' },
        { text: 'Срок', style: 'tableHeader' },
        { text: 'Бележки', style: 'tableHeader' }
      ]
    ];
    
    dateEntries.forEach(entry => {
      tableBody.push([
        { text: entry.time, alignment: 'center', fontSize: 8 },
        { text: entry.foodItemName, alignment: 'left', fontSize: 8 },
        { text: entry.quantity || '-', alignment: 'center', fontSize: 8 },
        { text: entry.temperature ? `${entry.temperature}°C` : 'Студено', alignment: 'center', fontSize: 8 },
        { text: `${entry.shelfLifeHours}ч`, alignment: 'center', fontSize: 8 },
        { text: entry.notes || '-', alignment: 'left', fontSize: 8 }
      ]);
    });
    
    content.push({
      table: {
        headerRows: 1,
        widths: [40, 100, 60, 60, 40, '*'],
        body: tableBody
      },
      layout: {
        fillColor: function (rowIndex) {
          return rowIndex === 0 ? '#2563eb' : (rowIndex % 2 === 0 ? '#f5f7fa' : null);
        },
        hLineWidth: function () { return 0.5; },
        vLineWidth: function () { return 0.5; },
        hLineColor: function () { return '#e2e8f0'; },
        vLineColor: function () { return '#e2e8f0'; }
      },
      margin: [0, 0, 0, 5]
    });
  });
  
  // Add footer
  content.push({
    text: [
      { text: 'Генерирано от H CONTROL\n', color: '#6b7280' },
      { text: WEBSITE_URL, color: '#0066cc', link: WEBSITE_URL }
    ],
    alignment: 'center',
    margin: [0, 20, 0, 0],
    fontSize: 9
  });
  
  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#111827'
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280'
      },
      metadata: {
        fontSize: 10,
        color: '#374151'
      },
      dateHeader: {
        fontSize: 12,
        bold: true,
        fillColor: '#f0f2f5',
        background: '#f0f2f5'
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: '#ffffff',
        fillColor: '#2563eb',
        alignment: 'center'
      }
    },
    defaultStyle: {
      fontSize: 9
    },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    footer: function(currentPage, pageCount) {
      return {
        text: `Страница ${currentPage} от ${pageCount}`,
        alignment: 'center',
        fontSize: 9,
        color: '#6b7280',
        margin: [0, 10, 0, 0]
      };
    }
  };
  
  pdfMake.createPdf(docDefinition).download(`dnevnik-hrani_${startDate}_${endDate}.pdf`);
};

// Export cleaning logs to PDF
export const exportCleaningLogsToPDF = async (
  logs: any[],
  startDate: string,
  endDate: string,
  establishment?: string
) => {
  // Initialize fonts before use
  initializeFonts();
  
  const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
  
  const content: Content = [];
  
  // Add logo
  if (logoBase64) {
    content.push({
      image: logoBase64,
      width: 150,
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Add title
  content.push({
    text: 'Дневник Почистване',
    style: 'header',
    alignment: 'center',
    margin: [0, 0, 0, 5]
  });
  
  content.push({
    text: 'Записи за почистване и дезинфекция',
    style: 'subheader',
    alignment: 'center',
    margin: [0, 0, 0, 10]
  });
  
  // Add metadata
  const dateRange = startDate === endDate 
    ? new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : `${new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG')} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('bg-BG')}`;
  
  if (establishment) {
    content.push({ text: `Обект: ${establishment}`, style: 'metadata' });
  }
  content.push({ text: `Период: ${dateRange}`, style: 'metadata' });
  content.push({ 
    text: `Генериран: ${new Date().toLocaleString('bg-BG')}`, 
    style: 'metadata',
    margin: [0, 0, 0, 15]
  });
  
  // Group logs by date
  const groupedLogs: Record<string, any[]> = {};
  logs.forEach(log => {
    if (!groupedLogs[log.logDate]) {
      groupedLogs[log.logDate] = [];
    }
    groupedLogs[log.logDate].push(log);
  });
  
  // Add logs for each date
  Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a)).forEach((date) => {
    const dateLogs = groupedLogs[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Date header
    content.push({
      text: new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      style: 'dateHeader',
      margin: [0, 10, 0, 5]
    });
    
    // Table
    const tableBody = [
      [
        { text: 'Период', style: 'tableHeader' },
        { text: 'Почиствани места', style: 'tableHeader' },
        { text: 'Препарати', style: 'tableHeader' },
        { text: 'Служител', style: 'tableHeader' },
        { text: 'Бележки', style: 'tableHeader' }
      ]
    ];
    
    dateLogs.forEach(log => {
      const cleaningAreas = Array.isArray(log.cleaningAreas) 
        ? log.cleaningAreas 
        : JSON.parse(log.cleaningAreas || '[]');
      const products = Array.isArray(log.products)
        ? log.products
        : JSON.parse(log.products || '[]');
      
      tableBody.push([
        { text: `${log.startTime} - ${log.endTime}`, alignment: 'center', fontSize: 8 },
        { text: cleaningAreas.join(', '), alignment: 'left', fontSize: 8 },
        { text: products.join(', '), alignment: 'left', fontSize: 8 },
        { text: log.employeeName || '-', alignment: 'center', fontSize: 8 },
        { text: log.notes || '-', alignment: 'left', fontSize: 8 }
      ]);
    });
    
    content.push({
      table: {
        headerRows: 1,
        widths: [60, 120, 80, 70, '*'],
        body: tableBody
      },
      layout: {
        fillColor: function (rowIndex) {
          return rowIndex === 0 ? '#2563eb' : (rowIndex % 2 === 0 ? '#f5f7fa' : null);
        },
        hLineWidth: function () { return 0.5; },
        vLineWidth: function () { return 0.5; },
        hLineColor: function () { return '#e2e8f0'; },
        vLineColor: function () { return '#e2e8f0'; }
      },
      margin: [0, 0, 0, 5]
    });
  });
  
  // Add footer
  content.push({
    text: [
      { text: 'Генерирано от H CONTROL\n', color: '#6b7280' },
      { text: WEBSITE_URL, color: '#0066cc', link: WEBSITE_URL }
    ],
    alignment: 'center',
    margin: [0, 20, 0, 0],
    fontSize: 9
  });
  
  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#111827'
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280'
      },
      metadata: {
        fontSize: 10,
        color: '#374151'
      },
      dateHeader: {
        fontSize: 12,
        bold: true,
        fillColor: '#f0f2f5',
        background: '#f0f2f5'
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: '#ffffff',
        fillColor: '#2563eb',
        alignment: 'center'
      }
    },
    defaultStyle: {
      fontSize: 9
    },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    footer: function(currentPage, pageCount) {
      return {
        text: `Страница ${currentPage} от ${pageCount}`,
        alignment: 'center',
        fontSize: 9,
        color: '#6b7280',
        margin: [0, 10, 0, 0]
      };
    }
  };
  
  pdfMake.createPdf(docDefinition).download(`dnevnik-pochistvane_${startDate}_${endDate}.pdf`);
};
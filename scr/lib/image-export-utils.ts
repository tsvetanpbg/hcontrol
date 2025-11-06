import html2canvas from 'html2canvas';

const LOGO_URL = 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/logo-concept-1760425219928.png';
const WEBSITE_URL = 'https://hcontrol.bg';

// A4 dimensions at 150 DPI (good for printing)
const A4_WIDTH = 1240;
const A4_HEIGHT = 1754;

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

/**
 * Preload image to avoid CORS issues
 */
const preloadImage = async (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

/**
 * Creates an HTML container with A4 dimensions for export
 */
const createA4Container = (content: string): HTMLDivElement => {
  const container = document.createElement('div');
  container.style.width = `${A4_WIDTH}px`;
  container.style.minHeight = `${A4_HEIGHT}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  
  // Add CSS to override oklch() colors with standard colors
  const styleOverride = document.createElement('style');
  styleOverride.textContent = `
    * {
      /* Override all oklch colors with standard hex colors */
      --background: #ffffff !important;
      --foreground: #111827 !important;
      --card: #ffffff !important;
      --card-foreground: #111827 !important;
      --popover: #ffffff !important;
      --popover-foreground: #111827 !important;
      --primary: #2563eb !important;
      --primary-foreground: #ffffff !important;
      --secondary: #f3f4f6 !important;
      --secondary-foreground: #111827 !important;
      --muted: #f3f4f6 !important;
      --muted-foreground: #6b7280 !important;
      --accent: #f3f4f6 !important;
      --accent-foreground: #111827 !important;
      --destructive: #ef4444 !important;
      --border: #e5e7eb !important;
      --input: #e5e7eb !important;
      --ring: #9ca3af !important;
      
      /* Force standard colors */
      background-color: #ffffff !important;
      color: #111827 !important;
    }
  `;
  container.appendChild(styleOverride);
  
  container.innerHTML += content;
  document.body.appendChild(container);
  return container;
};

/**
 * Converts container to image and downloads it
 */
const exportContainerAsImage = async (
  container: HTMLDivElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
) => {
  try {
    console.log('Starting html2canvas...');
    
    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
        });
      })
    );

    console.log('Images loaded, generating canvas...');

    const canvas = await html2canvas(container, {
      width: A4_WIDTH,
      backgroundColor: '#ffffff',
      scale: 1,
      logging: true,
      useCORS: true,
      allowTaint: false,
    });

    console.log('Canvas generated, converting to blob...');

    // Convert to blob with error handling
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          `image/${format}`,
          format === 'jpeg' ? 0.95 : 1
        );
      } catch (error) {
        reject(error);
      }
    });

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    console.log('Blob created, downloading...');

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Download complete!');
  } catch (error) {
    console.error('Error in exportContainerAsImage:', error);
    throw error;
  } finally {
    // Cleanup
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Export single temperature log to PNG/JPEG
 */
export const exportTemperatureLogsToImage = async (
  deviceName: string,
  deviceType: string,
  readings: any[],
  date: string,
  establishment?: string,
  format: 'png' | 'jpeg' = 'png'
) => {
  try {
    console.log('exportTemperatureLogsToImage called with:', { deviceName, deviceType, date, format });

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const tableRows = readings
      .map(
        (reading) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: center; ${readings.indexOf(reading) % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${reading.hour.toString().padStart(2, '0')}:00</td>
          <td style="padding: 12px; text-align: center; font-weight: 600; ${readings.indexOf(reading) % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${reading.temperature.toFixed(1)}°C</td>
          <td style="padding: 12px; ${readings.indexOf(reading) % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${reading.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <div style="max-width: 100%; margin: 0 auto;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${LOGO_URL}" alt="Logo" style="width: 180px; height: auto;" crossorigin="anonymous" />
        </div>
        
        <!-- Title -->
        <h1 style="text-align: center; font-size: 24px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">
          Температурен дневник
        </h1>
        <p style="text-align: center; font-size: 14px; color: #6b7280; margin: 0 0 30px 0;">
          ${deviceType} - ${deviceName}
        </p>
        
        <!-- Metadata -->
        ${establishment ? `<p style="font-size: 12px; color: #374151; margin: 5px 0;"><strong>Обект:</strong> ${establishment}</p>` : ''}
        <p style="font-size: 12px; color: #374151; margin: 5px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
        <p style="font-size: 12px; color: #374151; margin: 5px 0 30px 0;"><strong>Генериран:</strong> ${new Date().toLocaleString('bg-BG')}</p>
        
        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 40px;">
          <thead>
            <tr style="background-color: #2563eb; color: white;">
              <th style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #1e40af;">Час</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #1e40af;">Температура</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #1e40af;">Бележки</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #6b7280;">
          <p style="margin: 5px 0;">Генерирано от H CONTROL</p>
          <p style="margin: 5px 0; color: #0066cc;">${WEBSITE_URL}</p>
        </div>
      </div>
    `;

    console.log('Creating container...');
    const container = createA4Container(html);
    
    console.log('Exporting container as image...');
    await exportContainerAsImage(container, `${deviceName}_${date}`, format);
    
    console.log('Export complete!');
  } catch (error) {
    console.error('Error in exportTemperatureLogsToImage:', error);
    throw error;
  }
};

/**
 * Export all daily diaries to PNG/JPEG
 */
export const exportAllDailyDiariesToImage = async (
  devicesData: DeviceReadings[],
  date: string,
  establishment?: string,
  format: 'png' | 'jpeg' = 'png'
) => {
  try {
    console.log('exportAllDailyDiariesToImage called with:', { devicesCount: devicesData.length, date, format });

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Group devices by type
    const devicesByType: Record<string, DeviceReadings[]> = {};
    devicesData.forEach((item) => {
      if (!devicesByType[item.device.deviceType]) {
        devicesByType[item.device.deviceType] = [];
      }
      devicesByType[item.device.deviceType].push(item);
    });

    const typeOrder = ['Фризери', 'Хладилници', 'Топли витрини', 'Фритюрници'];

    // Build sections for each device type
    const sectionsHtml = typeOrder
      .filter((deviceType) => devicesByType[deviceType] && devicesByType[deviceType].length > 0)
      .map((deviceType) => {
        const devicesOfType = devicesByType[deviceType];

        const devicesHtml = devicesOfType
          .map((deviceData) => {
            const { device, readings } = deviceData;

            const tableRows = readings
              .map(
                (reading, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; text-align: center; font-size: 11px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${reading.hour.toString().padStart(2, '0')}:00</td>
                  <td style="padding: 8px; text-align: center; font-weight: 600; font-size: 11px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${reading.temperature.toFixed(1)}°C</td>
                  <td style="padding: 8px; font-size: 11px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${reading.notes || '-'}</td>
                </tr>
              `
              )
              .join('');

            return `
              <div style="margin-bottom: 20px;">
                <h4 style="font-size: 13px; font-weight: bold; background-color: #f0f9ff; padding: 8px; margin: 0 0 10px 0;">
                  ${device.deviceName} (${device.minTemp}°C до ${device.maxTemp}°C)
                </h4>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 15px;">
                  <thead>
                    <tr style="background-color: #475569; color: white;">
                      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: bold;">Час</th>
                      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: bold;">Температура</th>
                      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: bold;">Бележки</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              </div>
            `;
          })
          .join('');

        return `
          <div style="margin: 25px 0;">
            <h3 style="font-size: 16px; font-weight: bold; background-color: #2563eb; color: white; padding: 10px; margin: 0 0 15px 0;">
              ДНЕВНИК ${deviceType.toUpperCase()}
            </h3>
            ${devicesHtml}
          </div>
        `;
      })
      .join('');

    const html = `
      <div style="max-width: 100%; margin: 0 auto;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${LOGO_URL}" alt="Logo" style="width: 160px; height: auto;" crossorigin="anonymous" />
        </div>
        
        <!-- Title -->
        <h1 style="text-align: center; font-size: 22px; font-weight: bold; color: #111827; margin: 0 0 6px 0;">
          Дневен отчет - Всички дневници
        </h1>
        <p style="text-align: center; font-size: 13px; color: #6b7280; margin: 0 0 25px 0;">
          Фризери, Хладилници, Топли витрини, Фритюрници
        </p>
        
        <!-- Metadata -->
        ${establishment ? `<p style="font-size: 11px; color: #374151; margin: 4px 0;"><strong>Обект:</strong> ${establishment}</p>` : ''}
        <p style="font-size: 11px; color: #374151; margin: 4px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
        <p style="font-size: 11px; color: #374151; margin: 4px 0 25px 0;"><strong>Генериран:</strong> ${new Date().toLocaleString('bg-BG')}</p>
        
        <!-- Sections -->
        ${sectionsHtml}
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280;">
          <p style="margin: 4px 0;">Генерирано от H CONTROL</p>
          <p style="margin: 4px 0; color: #0066cc;">${WEBSITE_URL}</p>
        </div>
      </div>
    `;

    console.log('Creating container...');
    const container = createA4Container(html);
    
    console.log('Exporting container as image...');
    await exportContainerAsImage(container, `dnevnici-vsichki_${date}`, format);
    
    console.log('Export complete!');
  } catch (error) {
    console.error('Error in exportAllDailyDiariesToImage:', error);
    throw error;
  }
};

/**
 * Export food diary to PNG/JPEG
 */
export const exportFoodDiaryToImage = async (
  entries: any[],
  startDate: string,
  endDate: string,
  establishment?: string,
  format: 'png' | 'jpeg' = 'png'
) => {
  try {
    console.log('exportFoodDiaryToImage called with:', { entriesCount: entries.length, startDate, endDate, format });

    const dateRange =
      startDate === endDate
        ? new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : `${new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG')} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('bg-BG')}`;

    // Group entries by date
    const groupedEntries: Record<string, any[]> = {};
    entries.forEach((entry) => {
      if (!groupedEntries[entry.date]) {
        groupedEntries[entry.date] = [];
      }
      groupedEntries[entry.date].push(entry);
    });

    // Build sections for each date
    const sectionsHtml = Object.keys(groupedEntries)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const dateEntries = groupedEntries[date].sort((a, b) => a.time.localeCompare(b.time));

        const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const tableRows = dateEntries
          .map(
            (entry, idx) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 6px; text-align: center; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${entry.time}</td>
              <td style="padding: 6px; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${entry.foodItemName}</td>
              <td style="padding: 6px; text-align: center; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${entry.quantity || '-'}</td>
              <td style="padding: 6px; text-align: center; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${entry.temperature ? `${entry.temperature}°C` : 'Студено'}</td>
              <td style="padding: 6px; text-align: center; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${entry.shelfLifeHours}ч</td>
              <td style="padding: 6px; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${entry.notes || '-'}</td>
            </tr>
          `
          )
          .join('');

        return `
          <div style="margin: 20px 0;">
            <h3 style="font-size: 13px; font-weight: bold; background-color: #f0f9ff; padding: 8px; margin: 0 0 10px 0;">
              ${dateFormatted}
            </h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
              <thead>
                <tr style="background-color: #2563eb; color: white;">
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Час</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Храна</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Количество</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Темп.</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Срок</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Бележки</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        `;
      })
      .join('');

    const html = `
      <div style="max-width: 100%; margin: 0 auto;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${LOGO_URL}" alt="Logo" style="width: 160px; height: auto;" crossorigin="anonymous" />
        </div>
        
        <!-- Title -->
        <h1 style="text-align: center; font-size: 22px; font-weight: bold; color: #111827; margin: 0 0 6px 0;">
          Дневник Храни
        </h1>
        <p style="text-align: center; font-size: 13px; color: #6b7280; margin: 0 0 25px 0;">
          Автоматично генерирани записи
        </p>
        
        <!-- Metadata -->
        ${establishment ? `<p style="font-size: 11px; color: #374151; margin: 4px 0;"><strong>Обект:</strong> ${establishment}</p>` : ''}
        <p style="font-size: 11px; color: #374151; margin: 4px 0;"><strong>Период:</strong> ${dateRange}</p>
        <p style="font-size: 11px; color: #374151; margin: 4px 0 25px 0;"><strong>Генериран:</strong> ${new Date().toLocaleString('bg-BG')}</p>
        
        <!-- Sections -->
        ${sectionsHtml}
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280;">
          <p style="margin: 4px 0;">Генерирано от H CONTROL</p>
          <p style="margin: 4px 0; color: #0066cc;">${WEBSITE_URL}</p>
        </div>
      </div>
    `;

    console.log('Creating container...');
    const container = createA4Container(html);
    
    console.log('Exporting container as image...');
    await exportContainerAsImage(container, `dnevnik-hrani_${startDate}_${endDate}`, format);
    
    console.log('Export complete!');
  } catch (error) {
    console.error('Error in exportFoodDiaryToImage:', error);
    throw error;
  }
};

/**
 * Export cleaning logs to PNG/JPEG
 */
export const exportCleaningLogsToImage = async (
  logs: any[],
  startDate: string,
  endDate: string,
  establishment?: string,
  format: 'png' | 'jpeg' = 'png'
) => {
  try {
    console.log('exportCleaningLogsToImage called with:', { logsCount: logs.length, startDate, endDate, format });

    const dateRange =
      startDate === endDate
        ? new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : `${new Date(startDate + 'T00:00:00').toLocaleDateString('bg-BG')} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('bg-BG')}`;

    // Group logs by date
    const groupedLogs: Record<string, any[]> = {};
    logs.forEach((log) => {
      if (!groupedLogs[log.logDate]) {
        groupedLogs[log.logDate] = [];
      }
      groupedLogs[log.logDate].push(log);
    });

    // Build sections for each date
    const sectionsHtml = Object.keys(groupedLogs)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const dateLogs = groupedLogs[date].sort((a, b) => a.startTime.localeCompare(b.startTime));

        const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('bg-BG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const tableRows = dateLogs
          .map((log, idx) => {
            const cleaningAreas = Array.isArray(log.cleaningAreas)
              ? log.cleaningAreas
              : JSON.parse(log.cleaningAreas || '[]');
            const products = Array.isArray(log.products) ? log.products : JSON.parse(log.products || '[]');

            return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 6px; text-align: center; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${log.startTime} - ${log.endTime}</td>
              <td style="padding: 6px; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${cleaningAreas.join(', ')}</td>
              <td style="padding: 6px; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${products.join(', ')}</td>
              <td style="padding: 6px; text-align: center; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${log.employeeName || '-'}</td>
              <td style="padding: 6px; font-size: 9px; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">${log.notes || '-'}</td>
            </tr>
          `;
          })
          .join('');

        return `
          <div style="margin: 20px 0;">
            <h3 style="font-size: 13px; font-weight: bold; background-color: #f0f9ff; padding: 8px; margin: 0 0 10px 0;">
              ${dateFormatted}
            </h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
              <thead>
                <tr style="background-color: #2563eb; color: white;">
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Период</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Почиствани места</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Препарати</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Служител</th>
                  <th style="padding: 6px; text-align: center; font-size: 9px;">Бележки</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        `;
      })
      .join('');

    const html = `
      <div style="max-width: 100%; margin: 0 auto;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${LOGO_URL}" alt="Logo" style="width: 160px; height: auto;" crossorigin="anonymous" />
        </div>
        
        <!-- Title -->
        <h1 style="text-align: center; font-size: 22px; font-weight: bold; color: #111827; margin: 0 0 6px 0;">
          Дневник Почистване
        </h1>
        <p style="text-align: center; font-size: 13px; color: #6b7280; margin: 0 0 25px 0;">
          Записи за почистване и дезинфекция
        </p>
        
        <!-- Metadata -->
        ${establishment ? `<p style="font-size: 11px; color: #374151; margin: 4px 0;"><strong>Обект:</strong> ${establishment}</p>` : ''}
        <p style="font-size: 11px; color: #374151; margin: 4px 0;"><strong>Период:</strong> ${dateRange}</p>
        <p style="font-size: 11px; color: #374151; margin: 4px 0 25px 0;"><strong>Генериран:</strong> ${new Date().toLocaleString('bg-BG')}</p>
        
        <!-- Sections -->
        ${sectionsHtml}
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280;">
          <p style="margin: 4px 0;">Генерирано от H CONTROL</p>
          <p style="margin: 4px 0; color: #0066cc;">${WEBSITE_URL}</p>
        </div>
      </div>
    `;

    console.log('Creating container...');
    const container = createA4Container(html);
    
    console.log('Exporting container as image...');
    await exportContainerAsImage(container, `dnevnik-pochistvane_${startDate}_${endDate}`, format);
    
    console.log('Export complete!');
  } catch (error) {
    console.error('Error in exportCleaningLogsToImage:', error);
    throw error;
  }
};
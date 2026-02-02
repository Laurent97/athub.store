import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  useCORS?: boolean;
}

/**
 * Generate and download a PDF from an HTML element
 * @param elementId - ID of the HTML element to convert to PDF
 * @param options - PDF generation options
 */
export async function downloadPDF(
  elementId: string,
  filename: string = 'invoice.pdf',
  options: Omit<PDFOptions, 'filename'> = {}
): Promise<void> {
  try {
    const {
      quality = 2,
      scale = 2,
      useCORS = true
    } = options;

    // Get the element to convert
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Show loading toast
    console.log('Generating PDF...');

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale,
      useCORS,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      windowHeight: element.scrollHeight
    });

    // Get canvas dimensions
    const imgData = canvas.toDataURL('image/png', quality);
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeightPdf = pdf.internal.pageSize.getHeight();

    // Add image to PDF, creating new pages if needed
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeightPdf;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeightPdf;
    }

    // Download the PDF
    pdf.save(filename);
    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate PDF without downloading (returns blob)
 * @param elementId - ID of the HTML element to convert to PDF
 * @param filename - Name for the PDF file
 * @param options - PDF generation options
 * @returns Promise<Blob> - PDF as Blob
 */
export async function generatePDFBlob(
  elementId: string,
  filename: string = 'invoice.pdf',
  options: Omit<PDFOptions, 'filename'> = {}
): Promise<Blob> {
  try {
    const {
      quality = 2,
      scale = 2,
      useCORS = true
    } = options;

    // Get the element to convert
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale,
      useCORS,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      windowHeight: element.scrollHeight
    });

    // Get canvas dimensions
    const imgData = canvas.toDataURL('image/png', quality);
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeightPdf = pdf.internal.pageSize.getHeight();

    // Add image to PDF, creating new pages if needed
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeightPdf;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeightPdf;
    }

    // Return PDF as Blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw error;
  }
}

/**
 * Generate PDF with custom layout for invoices
 * @param elementId - ID of the HTML element to convert to PDF
 * @param orderNumber - Order number for filename
 */
export async function downloadInvoicePDF(
  elementId: string,
  orderNumber: string
): Promise<void> {
  try {
    const filename = `Invoice_${orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    await downloadPDF(elementId, filename, {
      quality: 0.95,
      scale: 2,
      useCORS: true
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw error;
  }
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteItem {
  name: string;
  type: string;
  price: number;
  displacement?: number;
  comboDetails?: string[];
}

interface QuoteData {
  quote_number: string;
  client_name: string;
  client_whatsapp?: string;
  client_email?: string;
  created_at: string;
  items: QuoteItem[];
  subtotal: number;
  discount_percentage: number;
  discount_value?: number;
  total: number;
}

interface ReceiptData {
  receipt_number: string;
  quote_number: string;
  client_name: string;
  client_whatsapp?: string;
  created_at: string;
  items: QuoteItem[];
  subtotal: number;
  discount_percentage: number;
  discount_value?: number;
  overtime_minutes?: number;
  overtime_value?: number;
  total: number;
  final_total: number;
}

interface ContractData {
  contract_number: string;
  client_name: string;
  content: string;
  created_at: string;
}

interface FinancialReportData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  transactions: Array<{
    date: string;
    description: string;
    type: string;
    amount: number;
  }>;
}

class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private primaryColor: [number, number, number] = [37, 99, 235]; // Blue-600
  private secondaryColor: [number, number, number] = [51, 65, 85]; // Slate-700

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addHeader(title: string, subtitle?: string) {
    // Company logo area (placeholder with colored rectangle)
    this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.rect(this.margin, this.currentY, 40, 15, 'F');
    
    // Company name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SG Multimídia', this.margin + 20, this.currentY + 9, { align: 'center' });
    
    // Document title
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.setFontSize(20);
    this.doc.text(title, this.pageWidth - this.margin, this.currentY + 5, { align: 'right' });
    
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.pageWidth - this.margin, this.currentY + 12, { align: 'right' });
    }
    
    this.currentY += 20;
    
    // Horizontal line
    this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 8;
  }

  private addFooter(pageNumber: number, totalPages: number) {
    const footerY = this.pageHeight - 15;
    
    this.doc.setFontSize(9);
    this.doc.setTextColor(128, 128, 128);
    this.doc.setFont('helvetica', 'normal');
    
    // Company info
    this.doc.text('SG Multimídia', this.margin, footerY);
    this.doc.text('sgmultimidiasps@gmail.com', this.margin, footerY + 4);
    
    // Page number
    this.doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      this.pageWidth - this.margin,
      footerY,
      { align: 'right' }
    );
    
    // Date
    const now = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    this.doc.text(`Gerado em: ${now}`, this.pageWidth - this.margin, footerY + 4, { align: 'right' });
  }

  private addClientInfo(clientName: string, clientContact?: string, clientEmail?: string) {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text('Cliente:', this.margin, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(clientName, this.margin + 20, this.currentY);
    
    this.currentY += 6;
    
    if (clientContact) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('WhatsApp:', this.margin, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(clientContact, this.margin + 25, this.currentY);
      this.currentY += 6;
    }
    
    if (clientEmail) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('E-mail:', this.margin, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(clientEmail, this.margin + 20, this.currentY);
      this.currentY += 6;
    }
    
    this.currentY += 5;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  async generateQuotePDF(data: QuoteData): Promise<jsPDF> {
    const doc = this.doc;
    const W = this.pageWidth;
    const H = this.pageHeight;

    // === BACKGROUND ===
    doc.setFillColor(15, 23, 42); // slate-950
    doc.rect(0, 0, W, H, 'F');

    // === HEADER BAR ===
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, W, 45, 'F');

    // Accent line
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, W, 2, 'F');

    // Company logo - loaded from server
    try {
      const logoResponse = await fetch('/logo-transparente.png');
      const logoBlob = await logoResponse.blob();
      const logoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoUrl, 'PNG', this.margin, 4, 28, 35);
    } catch(e) {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SG Multimídia', this.margin, 15);
    }

    // Document title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ORÇAMENTO', W - this.margin, 14, { align: 'right' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(99, 102, 241); // indigo-400
    doc.text(`#${data.quote_number}`, W - this.margin, 22, { align: 'right' });

    const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Data: ${formattedDate}`, W - this.margin, 29, { align: 'right' });

    // === CLIENT INFO CARD ===
    let y = 55;
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(this.margin, y, W - this.margin * 2, 28, 2, 2, 'F');

    doc.setFillColor(99, 102, 241);
    doc.rect(this.margin, y, 3, 28, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('CLIENTE', this.margin + 8, y + 8);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(data.client_name, this.margin + 8, y + 16);

    const contactParts = [];
    if (data.client_whatsapp) contactParts.push(`WhatsApp: ${data.client_whatsapp}`);
    if (data.client_email) contactParts.push(data.client_email);
    if (contactParts.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(contactParts.join('  |  '), this.margin + 8, y + 23);
    }

    y += 36;

    // === ITEMS ===
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('SERVIÇOS / PACOTES', this.margin, y);
    y += 5;

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(this.margin, y, W - this.margin * 2, 8, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(this.margin, y, W - this.margin * 2, 1, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('DESCRIÇÃO', this.margin + 4, y + 5);
    doc.text('TIPO', W - this.margin - 50, y + 5);
    doc.text('VALOR', W - this.margin - 4, y + 5, { align: 'right' });
    y += 9;

    // Table rows
    data.items.forEach((item, idx) => {
      const rowH = item.comboDetails && item.comboDetails.length > 0 ? 8 + item.comboDetails.length * 5 : 10;
      
      if (idx % 2 === 0) {
        doc.setFillColor(22, 33, 51);
        doc.rect(this.margin, y, W - this.margin * 2, rowH, 'F');
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const itemName = doc.splitTextToSize(item.name, W - this.margin * 2 - 70);
      doc.text(itemName[0], this.margin + 4, y + 6);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(item.type === 'service' ? 'Serviço' : 'Pacote', W - this.margin - 50, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text(this.formatCurrency(item.price), W - this.margin - 4, y + 6, { align: 'right' });

      if (item.comboDetails && item.comboDetails.length > 0) {
        let detailY = y + 11;
        item.comboDetails.forEach((detail) => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`• ${detail}`, this.margin + 8, detailY);
          detailY += 5;
        });
      }

      y += rowH;
    });

    // Bottom line
    doc.setFillColor(99, 102, 241);
    doc.rect(this.margin, y, W - this.margin * 2, 0.5, 'F');
    y += 8;

    // === TOTALS ===
    const totalsX = W - this.margin - 70;

    if (data.subtotal !== data.total) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Subtotal:', totalsX, y);
      doc.text(this.formatCurrency(data.subtotal), W - this.margin, y, { align: 'right' });
      y += 7;

      if (data.discount_percentage > 0) {
        doc.setTextColor(52, 211, 153); // green
        doc.text(`Desconto (${data.discount_percentage}%):`, totalsX, y);
        doc.text(`-${this.formatCurrency((data.subtotal * data.discount_percentage) / 100)}`, W - this.margin, y, { align: 'right' });
        y += 7;
      }
      if (data.discount_value && data.discount_value > 0) {
        doc.setTextColor(52, 211, 153);
        doc.text('Desconto:', totalsX, y);
        doc.text(`-${this.formatCurrency(data.discount_value)}`, W - this.margin, y, { align: 'right' });
        y += 7;
      }
    }

    // Total box
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(totalsX - 4, y - 3, W - this.margin - totalsX + 4, 12, 1, 1, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', totalsX, y + 6);
    doc.setTextColor(99, 102, 241);
    doc.text(this.formatCurrency(data.total), W - this.margin - 2, y + 6, { align: 'right' });
    y += 20;

    // === FOOTER ===
    doc.setFillColor(30, 41, 59);
    doc.rect(0, H - 18, W, 18, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(0, H - 18, W, 0.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('SG Multimídia  |  sgmultimidiasps@gmail.com  |  São Pedro do Sul - RS', W / 2, H - 10, { align: 'center' });
    doc.setTextColor(99, 102, 241);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, W / 2, H - 5, { align: 'center' });

    return this.doc;
  }

  generateReceiptPDF(data: ReceiptData): jsPDF {
    const doc = this.doc;
    const W = this.pageWidth;
    const margin = this.margin;
    let y = margin;

    // === HEADER ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('SG Multimídia', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Estúdio de Produção Audiovisual', margin, y);
    y += 5;
    doc.text('São Pedro do Sul - RS | WhatsApp: (55) 9 9660-2449', margin, y);
    y += 8;

    // Divider
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(margin, y, W - margin, y);
    y += 10;

    // === TITLE ===
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('R E C I B O', W / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    doc.text(`Orçamento #${data.quote_number} — Data: ${formattedDate}`, W / 2, y, { align: 'center' });
    y += 12;

    // === RECEIPT TEXT ===
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    const itemsText = data.items.map(item => item.name).join(', ');
    const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total);
    
    // Convert number to words (simplified)
    const receiptText = `Recebemos de ${data.client_name} a quantia de ${amountFormatted} referente a: ${itemsText}.`;
    const maxWidth = W - margin * 2;
    const splitText = doc.splitTextToSize(receiptText, maxWidth);
    doc.text(splitText, margin, y);
    y += splitText.length * 6 + 8;

    // Legal text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    const legalText = 'Para maior clareza, firmamos o presente recibo para que produza os seus efeitos, dando plena, geral e irrevogável quitação pelo valor acima especificado.';
    const splitLegal = doc.splitTextToSize(legalText, maxWidth);
    doc.text(splitLegal, margin, y);
    y += splitLegal.length * 5 + 15;

    // === DATE AND SIGNATURE ===
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    
    const now = new Date();
    const day = now.getDate();
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                       'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const dateText = `${now.toLocaleDateString('pt-BR', {day: '2-digit'})} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}.`;
    doc.text(dateText, margin, y);
    y += 20;

    // Signature line
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(data.client_name, margin, y);

    // === FOOTER ===
    const footerY = this.pageHeight - 15;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, W - margin, footerY - 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('SG Multimídia | sgmultimidiasps@gmail.com | São Pedro do Sul - RS', W / 2, footerY, { align: 'center' });

    return this.doc;
  }

    generateContractPDF(data: ContractData): jsPDF {
    this.addHeader('CONTRATO', data.contract_number);
    
    // Date
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    this.doc.text(`Data: ${formattedDate}`, this.margin, this.currentY);
    this.currentY += 10;
    
    // Contract content
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    
    const contentLines = data.content.split('\n');
    const maxWidth = this.pageWidth - (2 * this.margin);
    
    contentLines.forEach((line) => {
      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      
      const splitLines = this.doc.splitTextToSize(line || ' ', maxWidth);
      splitLines.forEach((splitLine: string) => {
        this.doc.text(splitLine, this.margin, this.currentY);
        this.currentY += 5;
      });
    });
    
    // Footer on all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages);
    }
    
    return this.doc;
  }

  generateFinancialReportPDF(data: FinancialReportData): jsPDF {
    this.addHeader('RELATÓRIO FINANCEIRO', data.period);
    
    // Summary cards
    const cardWidth = (this.pageWidth - (2 * this.margin) - 10) / 3;
    let cardX = this.margin;
    
    // Revenue card
    this.doc.setFillColor(34, 197, 94); // Green
    this.doc.rect(cardX, this.currentY, cardWidth, 20, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RECEITAS', cardX + cardWidth / 2, this.currentY + 7, { align: 'center' });
    this.doc.setFontSize(14);
    this.doc.text(this.formatCurrency(data.revenue), cardX + cardWidth / 2, this.currentY + 15, { align: 'center' });
    
    // Expenses card
    cardX += cardWidth + 5;
    this.doc.setFillColor(239, 68, 68); // Red
    this.doc.rect(cardX, this.currentY, cardWidth, 20, 'F');
    this.doc.setFontSize(10);
    this.doc.text('DESPESAS', cardX + cardWidth / 2, this.currentY + 7, { align: 'center' });
    this.doc.setFontSize(14);
    this.doc.text(this.formatCurrency(data.expenses), cardX + cardWidth / 2, this.currentY + 15, { align: 'center' });
    
    // Profit card
    cardX += cardWidth + 5;
    this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.rect(cardX, this.currentY, cardWidth, 20, 'F');
    this.doc.setFontSize(10);
    this.doc.text('LUCRO', cardX + cardWidth / 2, this.currentY + 7, { align: 'center' });
    this.doc.setFontSize(14);
    this.doc.text(this.formatCurrency(data.profit), cardX + cardWidth / 2, this.currentY + 15, { align: 'center' });
    
    this.currentY += 30;
    
    // Transactions table
    if (data.transactions.length > 0) {
      const tableData = data.transactions.map((t) => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description,
        t.type === 'income' ? 'Receita' : 'Despesa',
        this.formatCurrency(t.amount),
      ]);
      
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Data', 'Descrição', 'Tipo', 'Valor']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: this.primaryColor,
          textColor: 255,
          fontSize: 11,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: this.margin, right: this.margin },
      });
    }
    
    // Footer
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages);
    }
    
    return this.doc;
  }
}

export async function generateQuotePDF(data: QuoteData): Promise<void> {
  const generator = new PDFGenerator();
  const pdf = await generator.generateQuotePDF(data);
  pdf.save(`Orcamento_${data.quote_number}.pdf`);
}

export function generateReceiptPDF(data: ReceiptData): void {
  const generator = new PDFGenerator();
  const pdf = generator.generateReceiptPDF(data);
  pdf.save(`Recibo_${data.receipt_number}.pdf`);
}

export function generateContractPDF(data: ContractData): void {
  const generator = new PDFGenerator();
  const pdf = generator.generateContractPDF(data);
  pdf.save(`Contrato_${data.contract_number}.pdf`);
}

export function generateFinancialReportPDF(data: FinancialReportData): void {
  const generator = new PDFGenerator();
  const pdf = generator.generateFinancialReportPDF(data);
  pdf.save(`Relatorio_Financeiro_${data.period.replace(/\//g, '-')}.pdf`);
}

interface MonthlyReceiptData {
  client_name: string;
  client_whatsapp?: string;
  amount: number;
  description: string;
  month_reference: string;
  created_at: string;
}

export function generateMonthlyReceiptPDF(data: MonthlyReceiptData): void {
  const generator = new PDFGenerator();
  const doc = generator['doc']; // Access private doc property
  const margin = 20;
  let currentY = margin;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, currentY, 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SG Multimídia', margin + 20, currentY + 9, { align: 'center' });
  
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(20);
  doc.text('RECIBO MENSAL', doc.internal.pageSize.getWidth() - margin, currentY + 5, { align: 'right' });
  
  currentY += 20;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, doc.internal.pageSize.getWidth() - margin, currentY);
  currentY += 8;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Data de emissão: ${formattedDate}`, margin, currentY);
  currentY += 10;

  // Month reference
  const [year, month] = data.month_reference.split('-');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = monthNames[parseInt(month) - 1];
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Referente ao mês:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${monthName} de ${year}`, margin + 45, currentY);
  currentY += 10;

  // Client info
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_name, margin + 20, currentY);
  currentY += 6;
  
  if (data.client_whatsapp) {
    doc.setFont('helvetica', 'bold');
    doc.text('WhatsApp:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.client_whatsapp, margin + 25, currentY);
    currentY += 6;
  }
  
  currentY += 8;

  // Receipt content box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, doc.internal.pageSize.getWidth() - (2 * margin), 60, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, doc.internal.pageSize.getWidth() - (2 * margin), 60, 'S');
  
  currentY += 10;
  
  // Receipt text
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  
  const receiptText = `Recebemos de ${data.client_name} a importância de ${new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.amount)} referente a: ${data.description}.`;
  
  const maxWidth = doc.internal.pageSize.getWidth() - (2 * margin) - 10;
  const splitText = doc.splitTextToSize(receiptText, maxWidth);
  doc.text(splitText, margin + 5, currentY);
  
  currentY += splitText.length * 6 + 8;
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const legalText = 'Para maior clareza, firmamos o presente recibo para que produza os seus efeitos, dando plena, geral e irrevogável quitação pelo valor acima especificado.';
  const splitLegal = doc.splitTextToSize(legalText, maxWidth);
  doc.text(splitLegal, margin + 5, currentY);
  
  currentY += 40;
  
  // Amount highlight
  doc.setFillColor(34, 197, 94);
  doc.rect(margin, currentY, doc.internal.pageSize.getWidth() - (2 * margin), 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL:', margin + 10, currentY + 9);
  doc.setFontSize(18);
  doc.text(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount),
    doc.internal.pageSize.getWidth() - margin - 10,
    currentY + 10,
    { align: 'right' }
  );
  
  currentY += 35;
  
  // Signature line
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const signatureY = currentY + 30;
  const signatureWidth = 80;
  const signatureX = (doc.internal.pageSize.getWidth() - signatureWidth) / 2;
  
  doc.setDrawColor(51, 65, 85);
  doc.line(signatureX, signatureY, signatureX + signatureWidth, signatureY);
  doc.text(data.client_name, signatureX + signatureWidth / 2, signatureY + 5, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Assinatura do Cliente', signatureX + signatureWidth / 2, signatureY + 10, { align: 'center' });
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('SG Multimídia', margin, footerY);
  doc.text('sgmultimidiasps@gmail.com', margin, footerY + 4);
  doc.text('Página 1 de 1', doc.internal.pageSize.getWidth() - margin, footerY, { align: 'right' });
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Gerado em: ${now}`, doc.internal.pageSize.getWidth() - margin, footerY + 4, { align: 'right' });

  doc.save(`Recibo_Mensal_${data.client_name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`);
}
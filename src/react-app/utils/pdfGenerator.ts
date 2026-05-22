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

  generateQuotePDF(data: QuoteData): jsPDF {
    this.addHeader('ORÇAMENTO', `#${data.quote_number}`);
    
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
    
    // Client info
    this.addClientInfo(data.client_name, data.client_whatsapp, data.client_email);
    
    // Items table
    const tableData = data.items.map((item) => {
      const rows: any[] = [
        [
          item.name,
          item.type === 'service' ? 'Serviço' : 'Pacote',
          this.formatCurrency(item.price),
        ],
      ];
      
      // Add combo details
      if (item.comboDetails && item.comboDetails.length > 0) {
        item.comboDetails.forEach((detail) => {
          rows.push([`  • ${detail}`, '', '']);
        });
      }
      
      // Add displacement
      if (item.displacement && item.displacement > 0) {
        rows.push([
          '  + Deslocamento',
          '',
          this.formatCurrency(item.displacement),
        ]);
      }
      
      return rows;
    }).flat();
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Serviço/Produto', 'Tipo', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    // Get final Y position after table
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    
    // Totals
    const totalsX = this.pageWidth - this.margin - 60;
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text('Subtotal:', totalsX, this.currentY);
    this.doc.text(this.formatCurrency(data.subtotal), this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 6;
    
    if (data.discount_percentage > 0) {
      this.doc.setTextColor(37, 99, 235);
      this.doc.text(`Desconto (${data.discount_percentage}%):`, totalsX, this.currentY);
      this.doc.text(
        `-${this.formatCurrency((data.subtotal * data.discount_percentage) / 100)}`,
        this.pageWidth - this.margin,
        this.currentY,
        { align: 'right' }
      );
      this.currentY += 6;
    }
    
    if (data.discount_value && data.discount_value > 0) {
      this.doc.setTextColor(37, 99, 235);
      this.doc.text('Desconto (valor fixo):', totalsX, this.currentY);
      this.doc.text(
        `-${this.formatCurrency(data.discount_value)}`,
        this.pageWidth - this.margin,
        this.currentY,
        { align: 'right' }
      );
      this.currentY += 6;
    }
    
    // Total
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text('TOTAL:', totalsX, this.currentY);
    this.doc.text(this.formatCurrency(data.total), this.pageWidth - this.margin, this.currentY, { align: 'right' });
    
    // Footer
    this.addFooter(1, 1);
    
    return this.doc;
  }

  private numeroParaExtenso(valor: number): string {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
                      'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
                      'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    if (valor === 0) return 'zero';
    if (valor === 100) return 'cem';

    const partes: string[] = [];
    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);

    const converterCentena = (n: number): string => {
      if (n === 0) return '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;
      const parts: string[] = [];
      if (c > 0) parts.push(n === 100 ? 'cem' : centenas[c]);
      if (d >= 2) {
        parts.push(dezenas[d]);
        if (u > 0) parts.push(unidades[u]);
      } else if (d === 1 || (d === 0 && u > 0)) {
        parts.push(unidades[d * 10 + u]);
      }
      return parts.join(' e ');
    };

    if (inteiro >= 1000) {
      const mil = Math.floor(inteiro / 1000);
      const resto = inteiro % 1000;
      partes.push(mil === 1 ? 'mil' : `${converterCentena(mil)} mil`);
      if (resto > 0) partes.push(converterCentena(resto));
    } else if (inteiro > 0) {
      partes.push(converterCentena(inteiro));
    }

    const valorInteiro = inteiro === 1 ? `${partes.join(' e ')} real` : `${partes.join(' e ')} reais`;

    if (centavos > 0) {
      const centavoTexto = centavos === 1 ? `${unidades[centavos]} centavo` : `${converterCentena(centavos)} centavos`;
      if (inteiro === 0) return centavoTexto;
      return `${valorInteiro} e ${centavoTexto}`;
    }

    return valorInteiro;
  }

  generateReceiptPDF(data: ReceiptData): jsPDF {
    const doc = this.doc;
    const W = this.pageWidth;
    const margin = this.margin;
    let y = margin;

    // Outer border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, margin - 5, W - (margin - 5) * 2, 200, 'S');

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('SG Multimídia', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Estúdio de Produção Audiovisual', margin, y);
    y += 4;
    doc.text('São Pedro do Sul - RS | WhatsApp: (55) 9 9660-2449', margin, y);
    y += 6;

    // Divider
    doc.setLineWidth(0.3);
    doc.line(margin - 5, y, W - margin + 5, y);
    y += 10;

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('R E C I B O', W / 2, y, { align: 'center' });
    y += 7;

    // Quote number and date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    doc.text(`Orçamento #${data.quote_number} — ${formattedDate}`, W / 2, y, { align: 'center' });
    y += 14;

    // "Recebemos de CLIENT"
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Recebemos de ', margin, y);
    const recebeW = doc.getTextWidth('Recebemos de ');
    doc.setFont('helvetica', 'bold');
    doc.text(data.client_name, margin + recebeW, y);
    const nameW = doc.getTextWidth(data.client_name);
    doc.setLineWidth(0.3);
    doc.line(margin + recebeW, y + 1, margin + recebeW + nameW, y + 1);
    y += 10;

    // "a quantia de VALUE (extenso)"
    const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total);
    const amountExtenso = this.numeroParaExtenso(data.total);
    doc.setFont('helvetica', 'normal');
    doc.text('a quantia de  ', margin, y);
    const quantiaW = doc.getTextWidth('a quantia de  ');
    doc.setFont('helvetica', 'bold');
    doc.text(amountFormatted, margin + quantiaW, y);
    const amountW = doc.getTextWidth(amountFormatted);
    doc.line(margin + quantiaW, y + 1, margin + quantiaW + amountW, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.text(`  (${amountExtenso}),`, margin + quantiaW + amountW, y);
    y += 10;

    // "referente a: DESCRIPTION"
    const itemsText = data.items.map((item: any) => item.name).join(', ');
    doc.text('referente a: ', margin, y);
    const refW = doc.getTextWidth('referente a: ');
    doc.setFont('helvetica', 'bold');
    const splitDesc = doc.splitTextToSize(itemsText, W - margin * 2 - refW);
    doc.text(splitDesc[0], margin + refW, y);
    y += splitDesc.length * 6 + 8;

    // Legal text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const legalText = 'Para maior clareza, firmamos o presente recibo para que produza os seus efeitos, dando plena, geral e irrevogável quitação pelo valor acima especificado.';
    const splitLegal = doc.splitTextToSize(legalText, W - margin * 2);
    doc.text(splitLegal, margin, y);
    y += splitLegal.length * 5 + 14;

    // Date right-aligned
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                       'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const now = new Date();
    const dateText = `${String(now.getDate()).padStart(2, '0')} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}.`;
    doc.setFontSize(10);
    doc.text(dateText, W - margin, y, { align: 'right' });
    y += 20;

    // Signature line centered
    const lineX = W / 2;
    doc.setLineWidth(0.3);
    doc.line(lineX - 45, y, lineX + 45, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(data.client_name, lineX, y, { align: 'center' });

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

export function generateQuotePDF(data: QuoteData): void {
  const generator = new PDFGenerator();
  const pdf = generator.generateQuotePDF(data);
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
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Outer border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, W - (margin - 5) * 2, 190, 'S');

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('SG Multimídia', margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Estúdio de Produção Audiovisual', margin, y);
  y += 4;
  doc.text('São Pedro do Sul - RS | WhatsApp: (55) 9 9660-2449', margin, y);
  y += 6;

  doc.setLineWidth(0.3);
  doc.line(margin - 5, y, W - margin + 5, y);
  y += 10;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('R E C I B O', W / 2, y, { align: 'center' });
  y += 7;

  // Month reference
  const [year, month] = data.month_reference.split('-');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = monthNames[parseInt(month) - 1];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Referente ao mês de ${monthName} de ${year}`, W / 2, y, { align: 'center' });
  y += 14;

  // "Recebemos de CLIENT"
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Recebemos de ', margin, y);
  const recebeW = doc.getTextWidth('Recebemos de ');
  doc.setFont('helvetica', 'bold');
  doc.text(data.client_name, margin + recebeW, y);
  const nameW = doc.getTextWidth(data.client_name);
  doc.setLineWidth(0.3);
  doc.line(margin + recebeW, y + 1, margin + recebeW + nameW, y + 1);
  y += 10;

  // "a quantia de VALUE (extenso)"
  const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount);

  // Simple extenso function inline
  const numeroParaExtenso = (valor: number): string => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
                      'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
                      'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    if (valor === 0) return 'zero';
    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);
    const converterCentena = (n: number): string => {
      if (n === 0) return '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;
      const parts: string[] = [];
      if (c > 0) parts.push(n === 100 ? 'cem' : centenas[c]);
      if (d >= 2) { parts.push(dezenas[d]); if (u > 0) parts.push(unidades[u]); }
      else if (d === 1 || (d === 0 && u > 0)) { parts.push(unidades[d * 10 + u]); }
      return parts.join(' e ');
    };
    const partes: string[] = [];
    if (inteiro >= 1000) {
      const mil = Math.floor(inteiro / 1000);
      const resto = inteiro % 1000;
      partes.push(mil === 1 ? 'mil' : `${converterCentena(mil)} mil`);
      if (resto > 0) partes.push(converterCentena(resto));
    } else if (inteiro > 0) { partes.push(converterCentena(inteiro)); }
    const valorInteiro = inteiro === 1 ? `${partes.join(' e ')} real` : `${partes.join(' e ')} reais`;
    if (centavos > 0) {
      const centavoTexto = centavos === 1 ? `${unidades[centavos]} centavo` : `${converterCentena(centavos)} centavos`;
      if (inteiro === 0) return centavoTexto;
      return `${valorInteiro} e ${centavoTexto}`;
    }
    return valorInteiro;
  };

  const amountExtenso = numeroParaExtenso(data.amount);
  doc.setFont('helvetica', 'normal');
  doc.text('a quantia de  ', margin, y);
  const quantiaW = doc.getTextWidth('a quantia de  ');
  doc.setFont('helvetica', 'bold');
  doc.text(amountFormatted, margin + quantiaW, y);
  const amountW = doc.getTextWidth(amountFormatted);
  doc.line(margin + quantiaW, y + 1, margin + quantiaW + amountW, y + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(`  (${amountExtenso}),`, margin + quantiaW + amountW, y);
  y += 10;

  // "referente a: DESCRIPTION"
  doc.text('referente a: ', margin, y);
  const refW = doc.getTextWidth('referente a: ');
  doc.setFont('helvetica', 'bold');
  const maxWidth = W - margin * 2;
  const splitDesc = doc.splitTextToSize(data.description, maxWidth - refW);
  doc.text(splitDesc[0], margin + refW, y);
  y += splitDesc.length * 6 + 8;

  // Legal text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const legalText = 'Para maior clareza, firmamos o presente recibo para que produza os seus efeitos, dando plena, geral e irrevogável quitação pelo valor acima especificado.';
  const splitLegal = doc.splitTextToSize(legalText, maxWidth);
  doc.text(splitLegal, margin, y);
  y += splitLegal.length * 5 + 14;

  // Date right-aligned
  const monthNamesLower = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const now = new Date();
  const dateText = `${String(now.getDate()).padStart(2, '0')} de ${monthNamesLower[now.getMonth()]} de ${now.getFullYear()}.`;
  doc.text(dateText, W - margin, y, { align: 'right' });
  y += 20;

  // Signature line centered
  const lineX = W / 2;
  doc.setLineWidth(0.3);
  doc.line(lineX - 45, y, lineX + 45, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(data.client_name, lineX, y, { align: 'center' });

  doc.save(`Recibo_Mensal_${data.client_name.replace(/ /g, '_')}.pdf`);
}

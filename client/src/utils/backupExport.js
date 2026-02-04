import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as api from '../services/api';
import { getParties } from '../services/partyApi';

/**
 * Generates a comprehensive PDF backup of the system data
 */
export const generateFullBackupPDF = async () => {
    try {
        console.log('--- STARTING SYSTEM BACKUP GENERATION ---');

        // 1. Fetch all data in parallel
        const [
            items,
            orders,
            parties,
            employees,
            rawMaterials,
            jobCards,
            grns
        ] = await Promise.all([
            api.getAllItems(),
            api.getAllOrders(),
            api.getAllParties(),
            api.getAllEmployees(),
            api.getRawMaterials(),
            api.getJobCards(),
            api.getGRNs()
        ]);

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit
        const pageWidth = doc.internal.pageSize.width;

        // Helper for sections
        const addSectionHeader = (title, firstPage = false) => {
            if (!firstPage) doc.addPage();
            doc.setFillColor(30, 41, 59); // Slate-800
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), 15, 17);

            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 15, 17, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        };

        // --- SECTION 1: ITEMS ---
        addSectionHeader('SYSTEM BACKUP: ITEMS MASTER', true);
        autoTable(doc, {
            startY: 35,
            head: [['Code', 'Name', 'Category', 'Base Price', 'Current Stock', 'Unit']],
            body: items.map(i => [
                i.code || 'N/A',
                i.name || 'N/A',
                i.category || 'N/A',
                `INR ${i.basePrice || 0}`,
                i.currentStock || 0,
                i.unit || 'Units'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }
        });

        // --- SECTION 2: ORDERS ---
        addSectionHeader('SYSTEM BACKUP: PURCHASE ORDERS');
        autoTable(doc, {
            startY: 35,
            head: [['PO Number', 'Party Name', 'Date', 'Total Qty', 'Amount', 'Status']],
            body: orders.map(o => [
                o.poNumber || 'N/A',
                o.partyName || 'N/A',
                new Date(o.poDate).toLocaleDateString(),
                o.totalQty || 0,
                `INR ${o.totalAmount || 0}`,
                o.status || 'N/A'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }
        });

        // --- SECTION 3: PARTIES ---
        addSectionHeader('SYSTEM BACKUP: PARTIES (CUSTOMERS/VENDORS)');
        autoTable(doc, {
            startY: 35,
            head: [['Type', 'Code', 'Name', 'Contact', 'Email', 'City']],
            body: parties.map(p => [
                p.type || 'N/A',
                p.vendorCode || p.customerCode || 'N/A',
                p.name || 'N/A',
                p.contactPerson || 'N/A',
                p.email || 'N/A',
                p.city || 'N/A'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }
        });

        // --- SECTION 4: RAW MATERIALS ---
        addSectionHeader('SYSTEM BACKUP: RAW MATERIALS INVENTORY');
        autoTable(doc, {
            startY: 35,
            head: [['Code', 'Name', 'Category', 'Current Qty', 'Unit', 'Min Stock']],
            body: rawMaterials.map(rm => [
                rm.code || 'N/A',
                rm.name || 'N/A',
                rm.category || 'N/A',
                rm.qty || 0,
                rm.uom || 'N/A',
                rm.minStockLevel || 0
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }
        });

        // --- SECTION 5: JOB CARDS ---
        addSectionHeader('SYSTEM BACKUP: ACTIVE JOB CARDS');
        autoTable(doc, {
            startY: 35,
            head: [['Job #', 'Item', 'Qty', 'Stage', 'Priority', 'Status']],
            body: jobCards.map(jc => [
                jc.jobNumber || 'N/A',
                jc.itemId?.name || 'N/A',
                jc.quantity || 0,
                jc.stage || 'N/A',
                jc.priority || 'Normal',
                jc.status || 'N/A'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }
        });

        // --- SECTION 6: GRNs ---
        addSectionHeader('SYSTEM BACKUP: GOODS RECEIPT NOTES (GRN)');
        autoTable(doc, {
            startY: 35,
            head: [['GRN #', 'Supplier', 'Date', 'Invoice #', 'Total Items', 'Status']],
            body: grns.map(g => [
                g.grnNumber || 'N/A',
                g.supplierName || 'N/A',
                new Date(g.grnDate).toLocaleDateString(),
                g.invoiceNumber || 'N/A',
                g.items?.length || 0,
                g.status || 'N/A'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }
        });

        // Save PDF
        const filename = `ELINTS_OMS_BACKUP_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        console.log('--- BACKUP GENERATED SUCCESSFULLY ---');
        return { success: true, filename };

    } catch (error) {
        console.error('BACKUP ERROR:', error);
        return { success: false, error: error.message };
    }
};

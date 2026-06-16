// ============================================
// PDF GENERATOR - Ntsoa APPS
// Version PRO avec logo fonctionnel
// ============================================

let cachedLogo = null;

async function loadLogo() {
    return new Promise((resolve) => {
        if (cachedLogo) {
            resolve(cachedLogo);
            return;
        }
        
        // On utilise fetch pour récupérer l'image en tant que blob
        fetch('images/logo.png')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Logo non trouvé');
                }
                return response.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                    cachedLogo = reader.result;
                    resolve(cachedLogo);
                };
                reader.readAsDataURL(blob);
            })
            .catch(() => {
                console.warn('Logo non trouvé, génération sans logo');
                resolve(null);
            });
    });
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

async function generateReceiptPDF(receiptData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const leftMargin = 20;
    let y = 20;

    const logoDataURL = await loadLogo();

    // ========== 1. EN-TÊTE AVEC LOGO + INFOS CONTACT ==========
    if (logoDataURL) {
        try {
            doc.addImage(logoDataURL, 'PNG', leftMargin, y, 35, 0, undefined, 'FAST');
        } catch(e) {
            console.warn('Erreur ajout logo:', e);
        }
    }
    
    // Titre principal
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 95, 122);
    doc.text("NTSOA APPS", 105, y + 10, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Solutions de gestion scolaire", 105, y + 17, { align: "center" });
    doc.text("NIF: 5001 6939 46 | STAT: 61102 12 2014 0 01039", 105, y + 23, { align: "center" });
    
    // Coordonnées juste sous NIF/STAT
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Tel/WhatsApp: 038 30 148 83 | Email: contact@suitemg.com | Site: ecole.suitemg.com", 105, y + 30, { align: "center" });
    
    y = y + 38;
    
    // Ligne décorative
    doc.setDrawColor(26, 95, 122);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, y, 190, y);
    y += 8;

    // ========== 2. NUMÉRO DE REÇU (encadré) ==========
    doc.setFillColor(240, 242, 245);
    doc.rect(leftMargin, y, 170, 10, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 95, 122);
    doc.text(`N° ${receiptData.receiptNumber}`, 105, y + 7, { align: "center" });
    y += 14;

    // ========== 3. TABLEAU DES INFOS CLIENT ==========
    const clientInfo = [
        ["DATE D'EMISSION", receiptData.date, "CLIENT", receiptData.clientName],
        ["VILLE", receiptData.clientCity, "MODE DE PAIEMENT", receiptData.paymentMethod === 'Cheque' ? 'Chèque' : receiptData.paymentMethod]
    ];
    
    doc.autoTable({
        startY: y,
        body: clientInfo,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold', textColor: [26, 95, 122] },
            1: { cellWidth: 45 },
            2: { cellWidth: 40, fontStyle: 'bold', textColor: [26, 95, 122] },
            3: { cellWidth: 45 }
        },
        margin: { left: leftMargin, right: leftMargin }
    });
    
    y = doc.lastAutoTable.finalY + 8;

    // ========== 4. TABLEAU PRODUIT ==========
    const formattedAmount = formatNumber(receiptData.amount);
    
    doc.autoTable({
        startY: y,
        head: [["Désignation", "Montant (Ar)"]],
        body: [[receiptData.description, formattedAmount]],
        theme: 'striped',
        headStyles: { fillColor: [26, 95, 122], textColor: 255, fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 45, halign: 'right' } },
        margin: { left: leftMargin, right: leftMargin }
    });
    
    y = doc.lastAutoTable.finalY + 6;
    
    // TOTAL
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL TTC : ${formattedAmount} Ar`, 185, y, { align: "right" });
    y += 10;

    // ========== 5. MESSAGE PAIEMENT (encadré vert clair) ==========
    doc.setFillColor(230, 245, 235);
    doc.rect(leftMargin, y, 170, 12, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    doc.text("Reçu pour solde de tout compte", 105, y + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`La somme de ${formattedAmount} Ariary a été réglée par ${receiptData.paymentMethod}.`, 105, y + 9, { align: "center" });
    
    y += 16;

    // ========== 6. SIGNATURES ==========
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    
    doc.line(leftMargin, y + 8, leftMargin + 75, y + 8);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Signature du client", leftMargin, y + 13);
    
    doc.line(leftMargin + 95, y + 8, leftMargin + 170, y + 8);
    doc.text("Cachet de l'établissement", leftMargin + 105, y + 13);
    y += 25;

    // ========== 7. MENTIONS LÉGALES ==========
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("TVA non applicable - article 293B du CGI", 105, y, { align: "center" });
    y += 4;
    doc.text(`Reçu généré électroniquement par Ntsoa APPS - Fait à Antananarivo, le ${receiptData.date}`, 105, y, { align: "center" });

    // ========== SAUVEGARDE ==========
    doc.save(`recu_${receiptData.receiptNumber}.pdf`);
    
    if (typeof showToast === 'function') {
        showToast('PDF généré avec succès !');
    } else {
        alert('PDF généré avec succès !');
    }
}

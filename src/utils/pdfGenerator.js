import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from './helpers';
import { ImageStorageService } from '../services/imageStorage';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Toast } from '../components/Toast';
import { ARABIC_FONT_BASE64 } from './arabicFont';
import { reshapeArabic } from './arabicReshaper';

/**
 * Generate a PDF report for a vehicle movement
 * @param {Object} movement - The movement object
 * @param {Object} car - The car object
 */
export async function generateMovementReport(movement, car) {
    try {
        Toast.info('Generating report...', 1500);
        console.log('PDF Gen Started', movement.id);

        let doc;
        try {
            doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // Register Arabic font even for English template to support Arabic data (Model, Plate, etc.)
            doc.addFileToVFS('Lateef.ttf', ARABIC_FONT_BASE64);
            doc.addFont('Lateef.ttf', 'Lateef', 'normal');
            doc.addFont('Lateef.ttf', 'Lateef', 'bold');
            doc.setFont('helvetica', 'normal');

        } catch (jspdfErr) {
            console.error('jsPDF Init Error:', jspdfErr);
            Toast.error('Report initialization error: ' + jspdfErr.message);
            return;
        }

        // Helper to add centered text
        const centeredText = (text, y, size = 12, isBold = false) => {
            const style = isBold ? 'bold' : 'normal';
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            doc.setTextColor(40, 40, 40);
            const textWidth = doc.getTextWidth(text);
            const textOffset = (doc.internal.pageSize.width - textWidth) / 2;
            doc.text(text, textOffset, y);
        };

        // 1. Header
        doc.setTextColor(0, 0, 0);
        centeredText('AutoCheck Pro - Inspection Report', 22, 24, true);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        centeredText('Report Date: ' + new Date().toLocaleString(), 30, 11);
        doc.setDrawColor(230, 230, 230);
        doc.line(20, 35, 190, 35);

        // 2. Vehicle Info Section
        doc.setFillColor(245, 245, 245);
        doc.rect(15, 45, 180, 10, 'F');
        centeredText('VEHICLE INFORMATION', 52, 12, true);

        autoTable(doc, {
            startY: 56,
            margin: { left: 15, right: 15 },
            body: [
                ['Model', reshapeArabic(car.model)],
                ['Plate Number', reshapeArabic(car.plate)],
                ['Status', car.status === 'in' ? 'Inside' : 'Outside']
            ],
            styles: {
                font: 'Lateef',
                fontSize: 11,
                cellPadding: 4,
                halign: 'left',
                textColor: [40, 40, 40]
            },
            columnStyles: {
                0: { font: 'helvetica', cellWidth: 50, fontStyle: 'bold', fillColor: [250, 250, 250] },
                1: { halign: 'left', cellWidth: 'auto' }
            },
            theme: 'grid'
        });

        // 3. Movement Details Section
        doc.setFillColor(245, 245, 245);
        const detailStartY = doc.lastAutoTable.finalY + 12;
        doc.rect(15, detailStartY, 180, 10, 'F');
        centeredText('MOVEMENT DETAILS', detailStartY + 7, 12, true);

        const entries = [
            ['Operation ID', `MV-${movement.id}`],
            ['Driver', reshapeArabic(movement.driver)],
            ['Exit Time', movement.exitTime ? new Date(movement.exitTime).toLocaleString() : 'N/A'],
            ['Exit Mileage', `${movement.exitMileage || 0} KM`],
            ['Exit Fuel', `${movement.exitFuel || 0}%`]
        ];

        if (movement.status === 'completed') {
            entries.push(['Return Time', new Date(movement.returnTime).toLocaleString()]);
            entries.push(['Return Mileage', `${movement.returnMileage} KM`]);
            entries.push(['Return Fuel', `${movement.returnFuel}%`]);
            entries.push(['Distance Traveled', `${movement.returnMileage - movement.exitMileage} KM`]);
        }

        autoTable(doc, {
            startY: detailStartY + 12,
            margin: { left: 15, right: 15 },
            body: entries,
            styles: {
                font: 'Lateef',
                fontSize: 11,
                cellPadding: 4,
                halign: 'left',
                textColor: [40, 40, 40]
            },
            columnStyles: {
                0: { font: 'helvetica', cellWidth: 50, fontStyle: 'bold', fillColor: [250, 250, 250] },
                1: { halign: 'left', cellWidth: 'auto' }
            },
            theme: 'grid'
        });

        // Add Photos Section
        let currentY = doc.lastAutoTable.finalY + 10;

        const addPhotoSection = async (title, photos) => {
            if (!photos || photos.length === 0) return;

            // Check for page break
            if (currentY > 230) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text(title, 15, currentY); // Left aligned title for English
            currentY += 8;

            const imgWidth = 80;
            const imgHeight = 60;
            const margin = 10;
            let x = 15;

            for (const photo of photos) {
                try {
                    const path = typeof photo === 'string' ? photo : (photo.data || photo);
                    const base64 = await ImageStorageService.readAsBase64(path);

                    if (base64) {
                        const format = path.includes('.png') ? 'PNG' : 'JPEG';
                        doc.addImage(base64, format, x, currentY, imgWidth, imgHeight, undefined, 'FAST');
                        x += imgWidth + margin;

                        if (x + imgWidth > 195) {
                            x = 15;
                            currentY += imgHeight + margin;
                            if (currentY > 230) {
                                doc.addPage();
                                currentY = 20;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to add image to PDF", e);
                }
            }
            currentY = (x === 15) ? currentY + 10 : currentY + imgHeight + 15;
        };

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Thank you for using AutoCheck Pro.', 105, 285, { align: 'center' });

        const fileName = `report-${movement.id}-${Date.now()}.pdf`;

        if (Capacitor.isNativePlatform()) {
            Toast.info('Processing images...', 2000);
            await addPhotoSection('EXIT PHOTOS', movement.exitPhotos);
            await addPhotoSection('RETURN PHOTOS', movement.returnPhotos);

            Toast.info('Saving PDF...', 2000);
            const pdfOutput = doc.output('datauristring');
            const base64Data = pdfOutput.split(',')[1];

            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache
            });

            await Share.share({
                title: 'Inspection Report',
                text: `Report ID: ${movement.id}`,
                url: savedFile.uri,
                dialogTitle: 'Open or Share Report'
            });

        } else {
            await addPhotoSection('EXIT PHOTOS', movement.exitPhotos);
            await addPhotoSection('RETURN PHOTOS', movement.returnPhotos);
            doc.save(fileName);
            Toast.success('Report downloaded successfully');
        }
    } catch (globalErr) {
        console.error('GLOBAL PDF ERROR:', globalErr);
        Toast.error('PDF Error: ' + globalErr.message);
    }
};

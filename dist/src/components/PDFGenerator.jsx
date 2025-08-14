"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = usePDFGenerator;
const react_1 = require("react");
const jspdf_1 = require("jspdf");
const html2canvas_1 = __importDefault(require("html2canvas"));
const CommercialProposalHTML_1 = require("./CommercialProposalHTML");
function usePDFGenerator({ cartItems, userData }) {
    const proposalRef = (0, react_1.useRef)(null);
    const generatePdfBlob = async () => {
        if (!proposalRef.current) {
            console.error("Компонент для генерации PDF не смонтирован.");
            return null;
        }
        try {
            const canvas = await (0, html2canvas_1.default)(proposalRef.current, {
                scale: 1.5, // Уменьшаем масштаб с 2 до 1.5
                useCORS: true,
                logging: true,
                backgroundColor: null, // Оптимизация прозрачности
            });
            // Оптимизируем качество PNG
            const imgData = canvas.toDataURL('image/png', 0.85); // Уменьшаем качество до 85%
            const pdf = new jspdf_1.jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
                compress: true, // Включаем сжатие PDF
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const height = pdfWidth / ratio;
            // Добавляем изображение с оптимизированными настройками
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height, undefined, 'FAST');
            // Генерируем оптимизированный PDF
            const blob = pdf.output('blob');
            // Проверяем размер
            if (blob.size > 4 * 1024 * 1024) { // Если больше 4MB
                console.warn('⚠️ PDF слишком большой:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
                // Пробуем еще раз с меньшим качеством
                const canvas2 = await (0, html2canvas_1.default)(proposalRef.current, {
                    scale: 1, // Уменьшаем масштаб еще сильнее
                    useCORS: true,
                    logging: true,
                    backgroundColor: null,
                });
                const imgData2 = canvas2.toDataURL('image/png', 0.7); // Уменьшаем качество до 70%
                const pdf2 = new jspdf_1.jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4',
                    compress: true,
                });
                pdf2.addImage(imgData2, 'PNG', 0, 0, pdfWidth, height, undefined, 'FAST');
                return pdf2.output('blob');
            }
            return blob;
        }
        catch (error) {
            console.error("Ошибка при генерации PDF:", error);
            return null;
        }
    };
    const ProposalComponent = (0, react_1.useMemo)(() => {
        return (<div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
            <CommercialProposalHTML_1.CommercialProposalHTML ref={proposalRef} cartItems={cartItems} userData={userData}/>
        </div>);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartItems, userData, proposalRef]);
    return {
        generatePdfBlob,
        ProposalComponent
    };
}

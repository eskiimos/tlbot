"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const generateProposalHTML_1 = require("@/lib/generateProposalHTML");
async function GET(request) {
    try {
        console.log('🔍 Debug API Called');
        console.log('📁 Import check:', Boolean(generateProposalHTML_1.generateProposalHTML));
        console.log('🔍 generateProposalHTML type:', typeof generateProposalHTML_1.generateProposalHTML);
        // Пробуем создать тестовое КП
        const testData = {
            orderData: {},
            cartItems: [{
                    productName: 'Test Product',
                    productSlug: 'test',
                    quantity: 1,
                    basePrice: 1000,
                    selectedOptions: {},
                    optionsDetails: [],
                    totalPrice: 1000
                }],
            userData: {
                firstName: 'Test',
                lastName: 'User'
            }
        };
        const html = (0, generateProposalHTML_1.generateProposalHTML)(testData);
        console.log('✅ HTML Generated, length:', html.length);
        return server_1.NextResponse.json({
            status: 'success',
            importExists: Boolean(generateProposalHTML_1.generateProposalHTML),
            functionType: typeof generateProposalHTML_1.generateProposalHTML,
            htmlLength: html.length
        });
    }
    catch (error) {
        console.error('❌ Debug Error:', error);
        return server_1.NextResponse.json({
            status: 'error',
            error: String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

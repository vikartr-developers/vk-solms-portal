const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const NumberToWords = require('number-to-words');

/**
 * Converts an image file to a Base64 encoded string with its MIME type.
 * @param {string} filePath - The path to the image file.
 * @returns {string} The Base64 encoded image string, or an empty string if an error occurs.
 */
const imageToBase64 = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Error: Image file not found at path: ${filePath}`);
            return '';
        }

        const fileContent = fs.readFileSync(filePath);
        const base64String = fileContent.toString('base64');
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.png') {
            mimeType = 'image/png';
        } else if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
        } else if (ext === '.gif') {
            mimeType = 'image/gif';
        }
        return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
        console.error(`Error reading image file ${filePath}:`, error);
        return '';
    }
};

const companyLogoPath = path.join(__dirname, '../public/images/company_logo.jpg');

const companyLogoBase64 = imageToBase64(companyLogoPath);
const companyWatermarkLogoBase64 = companyLogoBase64;

/**
 * Generates an offer letter as a PDF using Puppeteer, based on the specified type.
 * @param {object} data - The data for the offer letter.
 * @param {string} data.offerLetterType - Type of offer letter: 'internship_zero_stipend', 'internship_stipend', or 'employee_salary'.
 * @param {string} [data.companyName='VIKARTR TECHNOLOGIES LLP'] - Name of the company.
 * @param {string} [data.companyAddress='E-823, Radhe Infinity, Raksha Shakti Cir, Urjanagar 1, Randesan, Gandhinagar, Gujarat 382421'] - Address of the company.
 * @param {string} [data.offerDate] - Date of the offer.
 * @param {string} [data.candidateName] - Name of the candidate/employee.
 * @param {string} [data.candidateAddress] - Address of the candidate/employee.
 * @param {string} [data.startDate] - Start date of internship/employment.
 * @param {string} [data.position='Web Developer Trainee'] - Position offered.
 * @param {number} [data.stipend=0] - Stipend or salary amount.
 * @param {string} [data.internshipPeriod='8 Weeks'] - Duration of internship (only for internship types).
 * @param {string} [data.supervisorName='BHAVIK S CHUDASAMA'] - Name of the supervisor/HR signing the letter.
 * @param {string} [data.hrName] - Name of the HR for the signature.
 * @param {string} [data.hrDesignation] - Designation of the HR for the signature.
 * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer.
 */
const generateOfferLetterPdf = async (data) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
        const page = await browser.newPage();

        const offerLetterType = data.offerLetterType || 'internship_stipend';

        const displayData = {
            companyName: data.companyName || 'VIKARTR TECHNOLOGIES LLP',
            companyAddress: data.companyAddress || 'E-823, Radhe Infinity, Raksha Shakti Cir, Urjanagar 1, Randesan, Gandhinagar, Gujarat 382421',
            offerDate: data.offerDate ? new Date(data.offerDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            candidateName: data.candidateName || 'Candidate Name',
            candidateAddress: data.candidateAddress || 'N/A',
            startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            position: data.position || 'Web Developer Trainee',
            internshipPeriod: data.internshipPeriod || '8 Weeks',
            supervisorName: data.supervisorName || 'BHAVIK S CHUDASAMA',
            hrName: data.hrName || 'HR Manager', 
            hrDesignation: data.hrDesignation || 'Human Resources Manager', 
            amount: data.stipend !== undefined && data.stipend !== null ? parseFloat(data.stipend).toFixed(0) : '0',
            amountInWords: (data.stipend !== undefined && data.stipend !== null && parseFloat(data.stipend) > 0)
                ? NumberToWords.toWords(Math.floor(parseFloat(data.stipend))).toUpperCase() + ' RUPEES ONLY'
                : 'ZERO RUPEES ONLY',
        };

        let subjectLine = '';
        let introParagraph = '';
        let commencementLine = '';
        let remunerationDetail = '';
        let closingParagraph = '';
        let acceptanceTerm = '';

        const isInternshipOffer = offerLetterType.startsWith('internship');
        const isUnpaidInternship = offerLetterType === 'internship_zero_stipend';
        const isEmployeeOffer = offerLetterType === 'employee_salary';

        if (isInternshipOffer) {
            subjectLine = 'Internship Offer Letter';
            introParagraph = `We are pleased to offer you an Internship at ${displayData.companyName.replace(' LLP', '')}. This letter outlines the terms & conditions of your internship.`;
            commencementLine = `Your internship with ${displayData.companyName.replace(' LLP', '')} will commence on **${displayData.startDate}**.`;
            if (isUnpaidInternship) {
                remunerationDetail = `Stipend: This is an **unpaid internship**.`;
            } else {
                remunerationDetail = `Stipend: INR ${displayData.amount} (${displayData.amountInWords})`;
            }
            closingParagraph = `We are excited to welcome you to ${displayData.companyName.replace(' LLP', '')} and look forward to your contributions to our team. If you have any questions about this offer letter, please do not hesitate to contact. Please sign and return a copy of this letter to signify your acceptance of this offer.`;
            acceptanceTerm = 'Internship';
        } else if (isEmployeeOffer) {
            subjectLine = 'Offer Letter - Employment';
            introParagraph = `We are pleased to offer you the position of ${displayData.position} at ${displayData.companyName.replace(' LLP', '')}. This letter outlines the terms & conditions of your employment.`;
            commencementLine = `Your employment with ${displayData.companyName.replace(' LLP', '')} will commence on ${displayData.startDate}.`;
            remunerationDetail = `Salary: INR ${displayData.amount} (${displayData.amountInWords}) per annum.`;
            closingParagraph = `We are excited to welcome you to ${displayData.companyName.replace(' LLP', '')} and look forward to your contributions to our team. If you have any questions about this offer letter, please do not hesitate to contact. Please sign and return a copy of this letter to signify your acceptance of this offer.`;
            acceptanceTerm = 'Employment';
        } else {
            subjectLine = 'Offer Letter';
            introParagraph = `We are pleased to offer you a position at ${displayData.companyName.replace(' LLP', '')}. This letter outlines the terms & conditions.`;
            commencementLine = `Your engagement with ${displayData.companyName.replace(' LLP', '')} will commence on ${displayData.startDate}.`;
            remunerationDetail = `Remuneration: As discussed.`;
            closingParagraph = `We are excited to welcome you to ${displayData.companyName.replace(' LLP', '')} and look forward to your contributions. Please sign and return a copy of this letter to signify your acceptance of this offer.`;
            acceptanceTerm = 'Offer';
        }


        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subjectLine} - ${displayData.candidateName}</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    margin: 0;
                    padding: 0;
                    font-size: 10pt; /* Further reduced font size */
                    line-height: 1.4; /* Slightly reduced line height */
                    color: #333;
                    position: relative;
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 70%;
                    height: auto;
                    opacity: 0.08;
                    z-index: -1;
                    pointer-events: none;
                }
                .container {
                    width: 100%;
                    max-width: 700px; /* Further reduced max-width */
                    margin: 0 auto;
                    padding: 20px 15px; /* Reduced padding */
                    position: relative;
                    z-index: 1;
                    background-color: rgba(255, 255, 255, 0.9);
                }
                .header {
                    text-align: center;
                    margin-bottom: 15px; /* Reduced margin */
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 8px; /* Reduced padding */
                    position: relative;
                    padding-left: 90px;
                }
                .header img {
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 70px; /* Slightly smaller logo */
                    object-fit: contain;
                }
                .header h1 {
                    margin: 0;
                    font-size: 15pt; /* Further reduced font size */
                    color: #000;
                    text-transform: uppercase;
                }
                .header p {
                    margin: 1px 0; /* Reduced margin */
                    font-size: 8.5pt; /* Further reduced font size */
                    color: #555;
                }
                .date-address {
                    margin-bottom: 15px; /* Reduced margin */
                }
                .date-address p {
                    margin: 0;
                    font-size: 10pt;
                }
                .subject {
                    font-weight: bold;
                    text-align: center;
                    margin: 15px 0; /* Reduced margin */
                    font-size: 11pt; /* Slightly reduced font size */
                    text-decoration: underline;
                }
                .content p {
                    margin-bottom: 8px; /* Reduced margin */
                    text-align: justify;
                }
                .content ul {
                    list-style-type: disc;
                    margin-left: 20px;
                    margin-bottom: 8px; /* Reduced margin */
                }
                .content ul li {
                    margin-bottom: 3px; /* Reduced margin */
                }
                .signature-block {
                    margin-top: 25px; /* Reduced margin */
                    text-align: left;
                }
                .signature-block p {
                    margin: 0;
                    font-weight: normal;
                    font-size: 10pt;
                }
                .signature-block .bold-line {
                    font-weight: bold;
                }
                .acceptance-section {
                    margin-top: 40px; /* Reduced margin */
                    border-top: 1px solid #ccc;
                    padding-top: 15px; /* Reduced padding */
                }
                .acceptance-section p {
                    margin-bottom: 10px; /* Reduced margin */
                    font-size: 10pt;
                }
            </style>
        </head>
        <body>
            ${companyWatermarkLogoBase64 ? `<img src="${companyWatermarkLogoBase64}" alt="Watermark" class="watermark">` : ''}
            <div class="container">
                <div class="header">
                    ${companyLogoBase64 ? `<img src="${companyLogoBase64}" alt="Company Logo">` : '<p>Company Logo Missing</p>'}
                    <h1>${displayData.companyName.replace(' LLP', '')}</h1>
                    <p>E-823, Radhe Infinity, Raksha Shakti Circle</p>
                    <p>Randesan, Gandhinagar Gujarat 382421</p>
                    <p>Phone: +91 9227000753</p>
                    <p>Email: info@vikartrtechnologies.com</p>
                    <p>Web: www.vikartrtechnologies.com</p>
                </div>

                <div class="date-address">
                    <p>To,</p>
                    <p>${displayData.candidateName}</p>
                    <p>${displayData.offerDate}</p>
                </div>

                <div class="subject">
                    ${subjectLine}
                </div>

                <div class="content">
                    <p>Dear ${displayData.candidateName},</p>
                    <p>${introParagraph}</p>
                    <p>${commencementLine}</p>
                    <p>Position: ${displayData.position}</p>
                    <p>${remunerationDetail}</p>
                    ${isInternshipOffer && displayData.internshipPeriod ? `<p>Internship Period: ${displayData.internshipPeriod}</p>` : ''}
                    <p>${closingParagraph}</p>
                </div>

                <div class="signature-block">
                    <p>Sincerely,</p>
                    <p class="bold-line">${displayData.hrName}</p>
                    <p class="bold-line">${displayData.hrDesignation}</p>
                    <p class="bold-line">${displayData.companyName}</p>
                </div>

                <div class="acceptance-section">
                    <p>Acceptance by ${displayData.candidateName}</p>
                    <p>I have read and understood the terms and conditions of this offer letter and accept the ${acceptanceTerm} at ${displayData.companyName}.</p>
                    <p>Signature: _________________________</p>
                    <p>Date: _________________________</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm' 
            }
        });
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating Offer Letter PDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = generateOfferLetterPdf;
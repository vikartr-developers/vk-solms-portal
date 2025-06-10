    const puppeteer = require('puppeteer');
    const fs = require('fs');
    const path = require('path');
    const NumberToWords = require('number-to-words');

    const imageToBase64 = (filePath) => {
        try {
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
    const supervisorSignaturePath = path.join(__dirname, '../public/images/supervisor_signature.png');

    const companyLogoBase64 = imageToBase64(companyLogoPath);
    const supervisorSignatureBase64 = imageToBase64(supervisorSignaturePath);


    const generatePdf = async (data) => {
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

            const displayData = {
                companyName: data.companyName || 'VIKARTR TECHNOLOGIES',
                employeeName: data.employeeName || 'N/A',
                empNo: data.empNo || 'N/A',
                dateOfJoining: data.dateOfJoining || 'N/A',
                panNo: data.panNo || 'N/A',
                pfNo: data.pfNo || 'N/A',
                pfUanNo: data.pfUanNo || 'N/A',
                esicNo: data.esicNo || 'N/A',
                aadharNo: data.aadharNo || 'N/A',
                gender: data.gender || 'N/A',
                designation: data.designation || 'N/A',
                department: data.department || 'N/A',
                grade: data.grade || 'N/A',
                vertical: data.vertical || 'N/A',
                division: data.division || 'N/A',
                location: data.location || 'N/A',
                paymentMode: data.paymentMode || 'N/A',
                bankName: data.bankName || 'N/A',
                bankAccountNo: data.bankAccountNo || 'N/A',
                month: data.month || 'N/A',
                totalNumberOfDays: data.totalNumberOfDays !== undefined ? data.totalNumberOfDays : 'N/A',
                workingDays: data.workingDays !== undefined ? data.workingDays : 'N/A',
                paidDays: data.paidDays !== undefined ? data.paidDays : 'N/A',
                lopDays: data.lopDays !== undefined ? data.lopDays : 'N/A',
                refundDays: data.refundDays !== undefined ? data.refundDays : 'N/A',
                arrearDays: data.arrearDays !== undefined ? data.arrearDays : 'N/A',

                earnings: {
                    basic: (data.earnings && data.earnings.basic !== undefined) ? data.earnings.basic.toFixed(2) : '0.00',
                    dearnessAllowance: (data.earnings && data.earnings.dearnessAllowance !== undefined) ? data.earnings.dearnessAllowance.toFixed(2) : '0.00',
                    houseRentAllowance: (data.earnings && data.earnings.houseRentAllowance !== undefined) ? data.earnings.houseRentAllowance.toFixed(2) : '0.00',
                    conveyanceAllowance: (data.earnings && data.earnings.conveyanceAllowance !== undefined) ? data.earnings.conveyanceAllowance.toFixed(2) : '0.00',
                    medicalAllowance: (data.earnings && data.earnings.medicalAllowance !== undefined) ? data.earnings.medicalAllowance.toFixed(2) : '0.00',
                    specialAllowance: (data.earnings && data.earnings.specialAllowance !== undefined) ? data.earnings.specialAllowance.toFixed(2) : '0.00',
                    uniformAllowance: (data.earnings && data.earnings.uniformAllowance !== undefined) ? data.earnings.uniformAllowance.toFixed(2) : '0.00',
                    internetAllowance: (data.earnings && data.earnings.internetAllowance !== undefined) ? data.earnings.internetAllowance.toFixed(2) : '0.00',
                    fuelAllowance: (data.earnings && data.earnings.fuelAllowance !== undefined) ? data.earnings.fuelAllowance.toFixed(2) : '0.00',
                    childrenEducationAllowance: (data.earnings && data.earnings.childrenEducationAllowance !== undefined) ? data.earnings.childrenEducationAllowance.toFixed(2) : '0.00',
                    otherAllowance: (data.earnings && data.earnings.otherAllowance !== undefined) ? data.earnings.otherAllowance.toFixed(2) : '0.00',
                },
                deductions: {
                    professionalTax: (data.deductions && data.deductions.professionalTax !== undefined) ? data.deductions.professionalTax.toFixed(2) : '0.00',
                    taxDeductedAtSource: (data.deductions && data.deductions.taxDeductedAtSource !== undefined) ? data.deductions.taxDeductedAtSource.toFixed(2) : '0.00',
                    employeeProvidentFund: (data.deductions && data.deductions.employeeProvidentFund !== undefined) ? data.deductions.employeeProvidentFund.toFixed(2) : '0.00',
                    lwf: (data.deductions && data.deductions.lwf !== undefined) ? data.deductions.lwf.toFixed(2) : '0.00',
                    leave: (data.deductions && data.deductions.leave !== undefined) ? data.deductions.leave.toFixed(2) : '0.00',
                },
                grossSalary: data.grossSalary !== undefined ? data.grossSalary.toFixed(2) : '0.00',
                totalDeduction: data.totalDeduction !== undefined ? data.totalDeduction.toFixed(2) : '0.00',
                netSalary: data.netSalary !== undefined ? data.netSalary.toFixed(2) : '0.00',
                salaryCtc: data.salaryCtc !== undefined ? data.salaryCtc.toFixed(2) : '0.00',
                netSalaryInWords: data.netSalaryInWords || 'Zero Rupees Only',
            };

            const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Salary Slip - ${displayData.employeeName} - ${displayData.month}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 10px; /* Reduced overall margin */
                        padding: 10px; /* Reduced overall padding */
                        font-size: 8px; /* Reduced base font size */
                        color: #333;
                    }
                    .container {
                        width: 210mm; /* A4 width */
                        min-height: 297mm; /* A4 height */
                        margin: 0 auto;
                        border: 1px solid #ccc;
                        padding: 10px; /* Reduced container padding */
                        box-sizing: border-box;
                        background-color: #fff;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 10px; /* Reduced header margin */
                        border-bottom: 1px solid #333; /* Thinner border */
                        padding-bottom: 5px; /* Reduced padding */
                        position: relative;
                    }
                    .header img {
                        position: absolute;
                        left: 10px; /* Reduced left position */
                        top: 0;
                        height: 60px; /* Reduced logo height */
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 16px; /* Reduced heading size */
                        color: #000;
                        text-transform: uppercase;
                    }
                    .header p {
                        margin: 2px 0; /* Reduced paragraph margin */
                        font-size: 8px; /* Reduced paragraph font size */
                        color: #555;
                    }
                    .payslip-title {
                        text-align: center;
                        background-color: #eee;
                        padding: 5px; /* Reduced padding */
                        margin-bottom: 10px; /* Reduced margin */
                        font-size: 12px; /* Reduced font size */
                        font-weight: bold;
                        border: 1px solid #ddd;
                    }
                    .employee-details, .salary-summary {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px; /* Reduced margin */
                    }
                    .employee-details td, .salary-summary td {
                        padding: 4px; /* Reduced padding */
                        border: 1px solid #ddd;
                        vertical-align: top;
                        font-size: 8px; /* Reduced font size */
                    }
                    .employee-details td:first-child, .salary-summary td:first-child {
                        width: 120px; /* Slightly reduced width */
                        font-weight: bold;
                        background-color: #f9f9f9;
                    }
                    .section-title {
                        font-weight: bold;
                        background-color: #f0f0f0;
                        text-align: center;
                        padding: 4px; /* Reduced padding */
                        border: 1px solid #ddd;
                        font-size: 9px; /* Reduced font size */
                    }
                    .earnings-deductions-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px; /* Reduced margin */
                    }
                    .earnings-deductions-table th,
                    .earnings-deductions-table td {
                        border: 1px solid #ddd;
                        padding: 4px; /* Reduced padding */
                        text-align: left;
                        font-size: 8px; /* Reduced font size */
                    }
                    .earnings-deductions-table th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        text-align: center;
                    }
                    .total-row td {
                        font-weight: bold;
                        background-color: #e6e6e6;
                        font-size: 8px; /* Reduced font size */
                        padding: 4px; /* Reduced padding */
                    }
                    .net-salary-section {
                        margin-top: 10px; /* Reduced margin */
                        border: 1px solid #ddd;
                        padding: 5px; /* Reduced padding */
                        background-color: #f9f9f9;
                    }
                    .net-salary-section p {
                        margin: 3px 0; /* Reduced margin */
                        font-size: 9px; /* Reduced font size */
                    }
                    .net-salary-section p strong {
                        font-size: 10px; /* Reduced strong font size */
                        color: #000;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px; /* Reduced margin */
                        font-size: 7px; /* Reduced font size */
                        color: #777;
                    }
                    .signature-section {
                        display: flex;
                        justify-content: flex-end;
                        margin-top: 15px; /* Reduced margin */
                        padding-right: 30px; /* Reduced padding */
                    }
                    .signature-section div {
                        text-align: center;
                    }
                    .signature-section img {
                        max-width: 80px; /* Reduced image width */
                        height: auto;
                        display: block;
                        margin: 0 auto 3px; /* Reduced margin */
                    }
                    .signature-section p {
                        margin: 0;
                        font-weight: bold;
                        font-size: 8px; /* Reduced font size */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        ${companyLogoBase64 ? `<img src="${companyLogoBase64}" alt="Company Logo">` : ''}
                        <h1>${displayData.companyName} LLP</h1>
                        <p>CIN: U72200GJ2016LLP091929</p>
                        <p>Address: E-823, Radhe Infinity, Raksha Shakti Cir, Urjanagar 1, Randesan, Gandhinagar, Gujarat 382421</p>
                    </div>

                    <div class="payslip-title">
                        Payslip for the month of ${displayData.month.toUpperCase()}
                    </div>

                    <table class="employee-details">
                        <tr>
                            <td>Emp. No:</td><td>${displayData.empNo}</td>
                            <td>Employee Name:</td><td>${displayData.employeeName}</td>
                        </tr>
                        <tr>
                            <td>Designation:</td><td>${displayData.designation}</td>
                            <td>Department:</td><td>${displayData.department}</td>
                        </tr>
                        <tr>
                            <td>Location:</td><td>${displayData.location}</td>
                            <td>Date of Joining:</td><td>${displayData.dateOfJoining}</td>
                        </tr>
                        <tr>
                            <td>PAN No:</td><td>${displayData.panNo}</td>
                            <td>PF No:</td><td>${displayData.pfNo}</td>
                        </tr>
                        <tr>
                            <td>PF UAN No:</td><td>${displayData.pfUanNo}</td>
                            <td>ESIC No:</td><td>${displayData.esicNo}</td>
                        </tr>
                        <tr>
                            <td>Aadhar No:</td><td>${displayData.aadharNo}</td>
                            <td>Gender:</td><td>${displayData.gender}</td>
                        </tr>
                        <tr>
                            <td>Grade:</td><td>${displayData.grade}</td>
                            <td>Vertical:</td><td>${displayData.vertical}</td>
                        </tr>
                        <tr>
                            <td>Division:</td><td>${displayData.division}</td>
                            <td>Payment Mode:</td><td>${displayData.paymentMode}</td>
                        </tr>
                        <tr>
                            <td>Bank Name:</td><td>${displayData.bankName}</td>
                            <td>Bank A/C No:</td><td>${displayData.bankAccountNo}</td>
                        </tr>
                    </table>

                    <table class="employee-details">
                        <tr>
                            <td>Total Number Of Days:</td><td>${displayData.totalNumberOfDays}</td>
                            <td>Working Days:</td><td>${displayData.workingDays}</td>
                        </tr>
                        <tr>
                            <td>Paid Days:</td><td>${displayData.paidDays}</td>
                            <td>LOP Days:</td><td>${displayData.lopDays}</td>
                        </tr>
                        <tr>
                            <td>Refund Days:</td><td>${displayData.refundDays}</td>
                            <td>Arrear Days:</td><td>${displayData.arrearDays}</td>
                        </tr>
                    </table>

                    <table class="earnings-deductions-table">
                        <thead>
                            <tr>
                                <th>Earnings</th>
                                <th>Monthly Rate (INR)</th>
                                <th>Current Month (INR)</th>
                                <th>Arrears (INR)</th>
                                <th>Total (INR)</th>
                                <th>Deductions</th>
                                <th>Total (INR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Basic</td>
                                <td>-</td>
                                <td>${displayData.earnings.basic}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.basic}</td>
                                <td>Professional Tax</td>
                                <td>${displayData.deductions.professionalTax}</td>
                            </tr>
                            <tr>
                                <td>Dearness Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.dearnessAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.dearnessAllowance}</td>
                                <td>Tax Deducted at Source</td>
                                <td>${displayData.deductions.taxDeductedAtSource}</td>
                            </tr>
                            <tr>
                                <td>House Rent Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.houseRentAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.houseRentAllowance}</td>
                                <td>Employee Provident Fund</td>
                                <td>${displayData.deductions.employeeProvidentFund}</td>
                            </tr>
                            <tr>
                                <td>Conveyance Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.conveyanceAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.conveyanceAllowance}</td>
                                <td>LWF</td>
                                <td>${displayData.deductions.lwf}</td>
                            </tr>
                            <tr>
                                <td>Medical Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.medicalAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.medicalAllowance}</td>
                                <td>Leave</td>
                                <td>${displayData.deductions.leave}</td>
                            </tr>
                            <tr>
                                <td>Special Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.specialAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.specialAllowance}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Uniform Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.uniformAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.uniformAllowance}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Internet Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.internetAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.internetAllowance}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Fuel Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.fuelAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.fuelAllowance}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Children Education Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.childrenEducationAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.childrenEducationAllowance}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Other Allowance</td>
                                <td>-</td>
                                <td>${displayData.earnings.otherAllowance}</td>
                                <td>0.00</td>
                                <td>${displayData.earnings.otherAllowance}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="4" style="text-align: right;">Gross Earnings (INR)</td>
                                <td>${displayData.grossSalary}</td>
                                <td style="text-align: right;">Total Deductions (INR)</td>
                                <td>${displayData.totalDeduction}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="net-salary-section">
                        <p><strong>SALARY (CTC)/ PM:</strong> ${displayData.salaryCtc} </p>
                        <p><strong>Net Salary Payable (INR):</strong> ${displayData.netSalary}</p>
                        <p><strong>Net Salary Payable (In words):</strong> ${displayData.netSalaryInWords}</p>
                    </div>


                    <div class="footer">
                        <p>THIS IS A COMPUTER GENERATED PAYSLIP AND DOES NOT REQUIRE SIGNATURE AND STAMP</p>
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
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                }
            });
            return pdfBuffer;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    };
        
    module.exports = generatePdf;
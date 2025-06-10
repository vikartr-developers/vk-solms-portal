import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import './AdminOfferLetterForm.css';

const AdminOfferLetterForm = ({ employee, onSuccess, onCancel }) => {
    const initialOfferLetterType = employee?.employeeDetails?.isIntern ?
                                   (employee?.employeeDetails?.stipend > 0 ? 'internship_stipend' : 'internship_zero_stipend') :
                                   'employee_salary';

    const [formData, setFormData] = useState({
        offerLetterType: initialOfferLetterType, 
        employeeId: employee?.employeeDetails?.empNo || employee?.employeeId || '',
        offerDate: new Date().toISOString().split('T')[0],
        startDate: '',
        position: '',
        stipend: '', 
        internshipPeriod: '8 Weeks', 
        supervisorName: 'BHAVIK S CHUDASAMA',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (employee) {
            setFormData(prev => ({
                ...prev,
                employeeId: employee.employeeDetails?.empNo || employee.employeeId || '',
                offerLetterType: employee.employeeDetails?.isIntern ?
                                 (employee.employeeDetails?.stipend > 0 ? 'internship_stipend' : 'internship_zero_stipend') :
                                 'employee_salary',
                position: employee.employeeDetails?.designation || '',
                stipend: employee.employeeDetails?.salaryCtc || employee.employeeDetails?.stipend || '',
            }));
        }
    }, [employee]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                stipend: (formData.offerLetterType === 'internship_stipend' || formData.offerLetterType === 'employee_salary') && formData.stipend !== ''
                         ? parseFloat(formData.stipend)
                         : formData.stipend, 
            };

            if (!formData.offerLetterType.startsWith('internship')) {
                delete payload.internshipPeriod;
            }

            const res = await api.post('/offerletters/generate', payload, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const contentDisposition = res.headers['content-disposition'];
            let filename = `offer_letter_${formData.employeeId || 'unknown'}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setMessage('Offer letter generated and downloaded successfully!');
            if (onSuccess) onSuccess();

        } catch (err) {
            console.error('Error generating offer letter:', err);

            if (err.response && err.response.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const errorText = event.target.result;
                    try {
                        const errorJson = JSON.parse(errorText);
                        setError(errorJson.msg || errorJson.message || 'Failed to generate offer letter (from blob).');
                    } catch (parseError) {
                        setError('Failed to generate offer letter: ' + errorText);
                    }
                };
                reader.readAsText(err.response.data);
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to generate offer letter.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isInternshipOffer = formData.offerLetterType.startsWith('internship');
    const isStipendRequired = formData.offerLetterType === 'internship_stipend' || formData.offerLetterType === 'employee_salary';

    return (
        <form onSubmit={handleSubmit} className="admin-offer-letter-form">
            {message && <div className="form-alert success-alert">{message}</div>}
            {error && <div className="form-alert error-alert">{error}</div>}

            <div className="form-group">
                <label htmlFor="offerLetterType">Offer Letter Type*</label>
                <select
                    id="offerLetterType"
                    name="offerLetterType"
                    value={formData.offerLetterType}
                    onChange={handleChange}
                    required
                    className="form-input"
                >
                    <option value="internship_zero_stipend">Internship Offer Letter (Zero Stipend)</option>
                    <option value="internship_stipend">Internship Offer Letter (With Stipend)</option>
                    <option value="employee_salary">Employee Offer Letter (With Salary)</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="employeeId">Employee ID*</label>
                <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={!!employee}
                />
            </div>

            <div className="form-group">
                <label htmlFor="offerDate">Offer Date*</label>
                <input
                    type="date"
                    id="offerDate"
                    name="offerDate"
                    value={formData.offerDate}
                    onChange={handleChange}
                    required
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="startDate">Start Date*</label>
                <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="position">Position*</label>
                <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="form-input"
                />
            </div>

            {isStipendRequired && (
                <div className="form-group">
                    <label htmlFor="stipend">{isInternshipOffer ? 'Stipend (INR)*' : 'Salary (INR)*'}</label>
                    <input
                        type="number"
                        id="stipend"
                        name="stipend"
                        value={formData.stipend}
                        onChange={handleChange}
                        required={isStipendRequired} 
                        min="0"
                        step="0.01"
                        className="form-input"
                    />
                </div>
            )}

            {isInternshipOffer && (
                <div className="form-group">
                    <label htmlFor="internshipPeriod">Internship Period*</label>
                    <input
                        type="text"
                        id="internshipPeriod"
                        name="internshipPeriod"
                        value={formData.internshipPeriod}
                        onChange={handleChange}
                        required={isInternshipOffer}
                        className="form-input"
                    />
                </div>
            )}

            <div className="form-group">
                <label htmlFor="supervisorName">Supervisor Name*</label>
                <input
                    type="text"
                    id="supervisorName"
                    name="supervisorName"
                    value={formData.supervisorName}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="form-actions">
                <button
                    type="submit"
                    disabled={loading}
                    className="form-button generate-button"
                >
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </form>
    );
};

export default AdminOfferLetterForm;
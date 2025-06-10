import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import api from '../../lib/api'; 
import AdminOfferLetterForm from './AdminOfferLetterForm';
import './AdminDashboard.css'; 
import './AdminOfferLetterManagement.css'; 

const AdminOfferLetterManagement = () => {
    const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [employeesError, setEmployeesError] = useState('');

    const [downloadingOfferLetterId, setDownloadingOfferLetterId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoadingEmployees(true);
        setEmployeesError('');
        try {
            const response = await api.get('/users');
            const nonAdminEmployees = await Promise.all(
                response.data.filter(user => user.role === 'user').map(async (user) => {
                    try {
                        const offerLetterResponse = await api.get(`/offerletters/user/${user._id}`);
                        return {
                            ...user,
                            hasOfferLetter: !!offerLetterResponse.data, 
                            offerLetterId: offerLetterResponse.data ? offerLetterResponse.data._id : null
                        };
                    } catch (olError) {
                        if (olError.response && olError.response.status === 404) {
                            return { ...user, hasOfferLetter: false, offerLetterId: null };
                        }
                        console.warn(`Error checking offer letter for ${user.username} (ID: ${user._id}):`, olError.message);
                        return { ...user, hasOfferLetter: false, offerLetterId: null };
                    }
                })
            );
            setEmployees(nonAdminEmployees);
        } catch (err) {
            console.error('Error fetching employees for offer letter management:', err.response?.data?.message || err.message);
            setEmployeesError('Failed to fetch employees to manage offer letters. Please check your backend and ensure the offer letter lookup endpoint is working correctly.');
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handleGenerateClick = (employee) => {
        if (employee && employee._id) {
            if (employee.hasOfferLetter) {
                toast.info(`Offer letter for ${employee.employeeDetails?.employeeName || employee.username} has already been generated.`); 
            } else {
                setSelectedEmployee(employee);
                setShowOfferLetterModal(true);
            }
        } else {
            toast.error('Invalid employee selected for offer letter generation.'); 
        }
    };

    const handleDownloadOfferLetter = async (offerLetterId, employeeName) => {
        if (!offerLetterId) {
            toast.error('Cannot download: Offer letter ID is missing.'); 
            return;
        }

        setDownloadingOfferLetterId(offerLetterId); 
        try {
            const response = await api.get(`/offerletters/download/${offerLetterId}`, {
                responseType: 'blob', 
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const filename = `OfferLetter_${employeeName.replace(/\s/g, '_') || 'unknown'}.pdf`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url); 

            toast.success('Offer letter downloaded successfully!'); 
        } catch (err) {
            console.error('Error downloading offer letter:', err.response?.data?.msg || err.message);
            toast.error(err.response?.data?.msg || 'Failed to download offer letter. Please try again.'); 
        } finally {
            setDownloadingOfferLetterId(null); 
        }
    };

    const handleOfferLetterSuccess = () => {
        toast.success('Offer letter successfully generated!'); 
        setShowOfferLetterModal(false);
        setSelectedEmployee(null);
        fetchEmployees(); 
    };

    const handleOfferLetterCancel = () => {
        setShowOfferLetterModal(false);
        setSelectedEmployee(null);
    };

    return (
        <div className="admin-offer-letter-management-container">
            <div onClick={() => navigate('/admin/dashboard')}
                style={{
                    top: '20px',
                    left: '20px',
                    fontSize: '1.1em',
                    fontWeight: '1000',
                    color: 'blueviolet',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease, transform 0.2s ease'
                }}>
                &larr; Go to Dashboard
            </div>

            <h2 className="section-title">Manage Offer Letters</h2>

            <div className="section-block">
                <h3 className="section-subtitle">Generate Offer Letter for an Employee</h3>
                {loadingEmployees ? (
                    <p className="info-message">Loading employee list...</p>
                ) : employeesError ? (
                    <p className="error-message">{employeesError}</p>
                ) : employees.length === 0 ? (
                    <p className="info-message">No employees found. Please add employees first to generate offer letters.</p>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Employee ID</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(employee => (
                                    <tr key={employee._id}>
                                        <td>{employee.employeeDetails?.employeeName || employee.username || 'N/A'}</td>
                                        <td>{employee.employeeDetails?.empNo || employee.employeeId || 'N/A'}</td>
                                        <td>
                                            {employee.hasOfferLetter ? (
                                                <div className="button-group"> 
                                                    <span className="offer-letter-status generated-status">Offer Letter Generated</span>
                                                    <button
                                                        onClick={() => handleDownloadOfferLetter(
                                                            employee.offerLetterId,
                                                            employee.employeeDetails?.employeeName || employee.username
                                                        )}
                                                        className="action-button download-button"
                                                        disabled={downloadingOfferLetterId === employee.offerLetterId}
                                                    >
                                                        {downloadingOfferLetterId === employee.offerLetterId ? (
                                                            <span className="spinner"></span> 
                                                        ) : (
                                                            'Download PDF'
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerateClick(employee)}
                                                    className="action-button generate-button"
                                                >
                                                    Generate Offer Letter
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showOfferLetterModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">
                            {selectedEmployee ? `Generate Offer Letter for ${selectedEmployee.employeeDetails?.employeeName || selectedEmployee.username}` : "Generate New Offer Letter"}
                        </h3>
                        <AdminOfferLetterForm
                            employee={selectedEmployee}
                            onSuccess={handleOfferLetterSuccess}
                            onCancel={handleOfferLetterCancel}
                        />
                        <button onClick={handleOfferLetterCancel} className="modal-close-button">
                            &times;
                        </button>
                    </div>
                </div>
            )}
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default AdminOfferLetterManagement;

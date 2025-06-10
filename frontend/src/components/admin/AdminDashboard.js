import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css'; 

const AdminDashboard = () => {
    const [salarySlips, setSalarySlips] = useState([]);
    const [loadingSlips, setLoadingSlips] = useState(true);
    const [offerLetters, setOfferLetters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [downloadingOfferLetterId, setDownloadingOfferLetterId] = useState(null);
    const [downloadingSalarySlipId, setDownloadingSalarySlipId] = useState(null);

    useEffect(() => {
        fetchSalarySlips();
        fetchOfferLetters();
    }, []);

    const fetchOfferLetters = async () => {
        setLoading(true);
        try {
            const response = await api.get('/offerletters/all');
            setOfferLetters(response.data);
        } catch (err) {
            console.error('Error fetching offer letters:', err.response?.data?.msg || err.message);
            toast.error('Failed to fetch offer letter history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSalarySlips = async () => {
        setLoadingSlips(true);
        try {
            const response = await api.get('/salary/all');
            setSalarySlips(response.data.salarySlips);
        } catch (err) {
            console.error('Error fetching salary slips:', err.response?.data?.message || err.message);
            toast.error('Failed to fetch salary slips history.');
        } finally {
            setLoadingSlips(false);
        }
    };

    const handleDeleteSalarySlip = async (slipId) => {
        if (window.confirm('Are you sure you want to delete this salary slip? This action cannot be undone.')) {
            try {
                const response = await api.delete(`/salary/${slipId}`);
                toast.success(response.data.message);
                fetchSalarySlips();
            } catch (err) {
                console.error('Error deleting salary slip:', err.response?.data?.message || err.message);
                toast.error(err.response?.data?.message || 'Failed to delete salary slip.');
            }
        }
    };

    const handleDeleteOfferLetter = async (offerLetterId) => {
        if (!offerLetterId) {
            toast.error('Cannot delete: Offer letter ID is missing.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this offer letter? This action cannot be undone.')) {
            try {
                const response = await api.delete(`/offerletters/${offerLetterId}`);
                toast.success(response.data.msg || 'Offer letter deleted successfully!');
                fetchOfferLetters();
            } catch (err) {
                console.error('Error deleting offer letter:', err.response?.data?.msg || err.message);
                toast.error(err.response?.data?.msg || 'Failed to delete offer letter.');
            }
        }
    };

    const handleDownloadOfferLetter = async (letterId) => {
        if (!letterId) {
            toast.error('Cannot download: Offer letter ID is missing.');
            return;
        }

        setDownloadingOfferLetterId(letterId); 
        try {
            const response = await api.get(`/offerletters/download/${letterId}`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `offer_letter_${letterId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Offer letter downloaded successfully!');
        } catch (err) {
            console.error('Error downloading offer letter:', err.response?.data?.msg || err.message);
            toast.error(err.response?.data?.msg || 'Failed to download offer letter. Please ensure you are logged in.');
        } finally {
            setDownloadingOfferLetterId(null); 
        }
    };

    const handleDownloadSalarySlip = async (slipId) => {
        if (!slipId) {
            toast.error('Cannot download: Salary slip ID is missing.');
            return;
        }

        setDownloadingSalarySlipId(slipId); 
        try {
            const response = await api.get(`/salary/download/${slipId}`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salary_slip_${slipId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Salary slip downloaded successfully!');
        } catch (err) {
            console.error('Error downloading salary slip:', err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Failed to download salary slip. Please ensure you are logged in.');
        } finally {
            setDownloadingSalarySlipId(null); 
        }
    };

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-header">Admin Control Panel</h2>
            <p>Welcome, Admin! Select an action:</p>
            <div className="admin-actions-grid">
                <Link to="/admin/manage-users" className="action-card">
                    <h3>Manage Users</h3>
                    <p>Add, edit, or remove employee accounts.</p>
                </Link>
                <Link to="/admin/manage-salaries" className="action-card">
                    <h3>Manage Salary Slips</h3>
                    <p>Add and manage salary slip details for employees.</p>
                </Link>
                <Link to="/admin/manage-offerletters" className="action-card">
                    <h3>Manage Offer Letters</h3>
                    <p>Generate and manage offer letters for employees.</p>
                </Link>
            </div>

            <hr className="divider" /> 

            <div className="salary-history-section">
                <h3 className='section-subtitle'>History of Generated Salary Slips</h3>
                {loadingSlips ? (
                    <p>Loading salary history...</p>
                ) : salarySlips.length === 0 ? (
                    <p>No salary slips found in the history.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="salary-history-table">
                            <thead>
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Employee ID</th>
                                    <th>Email</th>
                                    <th>Month</th>
                                    <th>Gross Salary</th>
                                    <th>Net Salary</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salarySlips.map(slip => (
                                    <tr key={slip._id}>
                                        <td data-label="Employee Name">
                                            {slip.userId?.employeeDetails?.employeeName || slip.employeeName || slip.userId?.username || 'N/A'}
                                        </td>
                                        <td data-label="Employee ID">
                                            {slip.userId?.employeeDetails?.empNo || slip.empNo || 'N/A'}
                                        </td>
                                        <td data-label="Email">
                                            {slip.employeeEmail || slip.userId?.email || 'N/A'}
                                        </td>
                                        <td data-label="Month">{slip.month}</td>
                                        <td data-label="Gross Salary">₹{slip.grossSalary ? slip.grossSalary.toFixed(2) : '0.00'}</td>
                                        <td data-label="Net Salary">₹{slip.netSalary ? slip.netSalary.toFixed(2) : '0.00'}</td>
                                        <td data-label="Actions" className="actions-cell">
                                            <button
                                                onClick={() => handleDownloadSalarySlip(slip._id)}
                                                className="action-button download-btn"
                                                disabled={downloadingSalarySlipId === slip._id} 
                                            >
                                                {downloadingSalarySlipId === slip._id ? (
                                                    <span className="spinner"></span> 
                                                ) : (
                                                    'Download PDF'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSalarySlip(slip._id)}
                                                className="action-button delete-btn"
                                                disabled={downloadingSalarySlipId === slip._id} 
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <hr className="divider" /> 

            <div className="salary-history-section">
                <h3 className="section-subtitle">History of Generated Offer Letters</h3>
                {loading ? (
                    <p className="info-message">Loading offer letter history...</p>
                ) : offerLetters.length === 0 ? (
                    <p className="info-message">No offer letters found in the history.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="salary-history-table">
                            <thead>
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Employee ID</th>
                                    <th>Position</th>
                                    <th>Stipend</th>
                                    <th>Start Date</th>
                                    <th>Offer Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offerLetters.map(letter => (
                                    <tr key={letter._id}>
                                        <td>{letter.candidateName || letter.userId?.employeeDetails?.employeeName || letter.userId?.username || 'N/A'}</td>
                                        <td>{letter.userId?.employeeDetails?.empNo || letter.userId?.employeeId || letter.empNo || 'N/A'}</td>
                                        <td>{letter.position}</td>
                                        <td>₹{letter.stipend ? letter.stipend.toFixed(2) : '0.00'}</td>
                                        <td>{new Date(letter.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(letter.offerDate).toLocaleDateString()}</td>
                                        <td>
                                            <div className="button-group">
                                                <button
                                                    onClick={() => handleDownloadOfferLetter(letter._id)}
                                                    className="action-button download-btn"
                                                    disabled={downloadingOfferLetterId === letter._id} 
                                                >
                                                    {downloadingOfferLetterId === letter._id ? (
                                                        <span className="spinner"></span> 
                                                    ) : (
                                                        'Download PDF'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOfferLetter(letter._id)}
                                                    className="action-button delete-btn"
                                                    disabled={downloadingOfferLetterId === letter._id} 
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default AdminDashboard;
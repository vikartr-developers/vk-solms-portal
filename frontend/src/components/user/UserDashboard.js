import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserDashboard.css';

const UserDashboard = () => {
    const { user } = useAuth();
    const [salarySlips, setSalarySlips] = useState([]);
    const [userOfferLetters, setUserOfferLetters] = useState([]);
    const [loadingSlips, setLoadingSlips] = useState(true);
    const [loadingOfferLetters, setLoadingOfferLetters] = useState(true);

    const [downloadingSalarySlipId, setDownloadingSalarySlipId] = useState(null);
    const [downloadingOfferLetterId, setDownloadingOfferLetterId] = useState(null);

    useEffect(() => {
        const fetchSalarySlips = async () => {
            setLoadingSlips(true);
            try {
                const response = await api.get(`/salary/user/${user.id}`);
                setSalarySlips(response.data);
            } catch (err) {
                console.error('Error fetching salary slips:', err.response?.data?.message || err.message);
                toast.error('Failed to fetch your salary slips.');
            } finally {
                setLoadingSlips(false);
            }
        };

        const fetchUserOfferLetters = async () => {
            setLoadingOfferLetters(true);
            try {
                const response = await api.get(`/offerletters/user/${user.id}`);
                setUserOfferLetters(response.data ? [response.data] : []);
            } catch (err) {
                console.error('Error fetching offer letters:', err.response?.data?.msg || err.message);
                if (err.response && err.response.status === 404) {
                    setUserOfferLetters([]);
                    toast.info('No offer letter found for your account.');
                } else {
                    toast.error('Failed to fetch your offer letters.');
                }
            } finally {
                setLoadingOfferLetters(false);
            }
        };

        if (user) {
            fetchSalarySlips();
            fetchUserOfferLetters();
        }
    }, [user]);


    const handleDownloadSlip = async (salaryId, employeeName, month) => {

        setDownloadingSalarySlipId(salaryId);
        try {
            const response = await api.get(`/salary/download/${salaryId}`, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = `${employeeName.replace(/\s/g, '_')}_SalarySlip_${month.replace(/\s/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
            toast.success('Salary slip downloaded successfully!');
        } catch (err) {
            console.error('Error downloading salary slip:', err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Failed to download salary slip.');
        } finally {
            setDownloadingSalarySlipId(null);
        }
    };

    const handleDownloadOfferLetter = async (letterId, candidateName, offerDate) => {
        setDownloadingOfferLetterId(letterId);
        try {
            const response = await api.get(`/offerletters/download/${letterId}`, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = fileURL;
            const formattedOfferDate = new Date(offerDate).toLocaleDateString('en-CA');
            link.download = `${candidateName.replace(/\s/g, '_')}_OfferLetter_${formattedOfferDate}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
            toast.success('Offer letter downloaded successfully!');
        } catch (err) {
            console.error('Error downloading offer letter:', err.response?.data?.msg || err.message);
            toast.error(err.response?.data?.msg || 'Failed to download offer letter.');
        } finally {
            setDownloadingOfferLetterId(null);
        }
    };

    if (loadingSlips || loadingOfferLetters) {
        return <div className="dashboard-container">Loading your documents...</div>;
    }

    return (
        <div className="dashboard-container">
            <h2>My Dashboard</h2>

            <div className="dashboard-section">
                <h3>My Salary Slips</h3>
                {salarySlips.length === 0 ? (
                    <p>No salary slips found for your account. Please contact your administrator.</p>
                ) : (
                    <ul className="salary-list">
                        {salarySlips.map(slip => (
                            <li key={slip._id} className="salary-slip-item">
                                <div className="salary-slip-info">
                                    <strong>Month: {slip.month}</strong>
                                    <span>Gross Salary: ₹{slip.grossSalary.toFixed(2)}</span>
                                    <span>Net Salary: ₹{slip.netSalary.toFixed(2)}</span>
                                </div>
                                <div className="salary-slip-actions">
                                    <button
                                        onClick={() => handleDownloadSlip(slip._id, slip.employeeName, slip.month)}
                                        className="download-btn"
                                        disabled={downloadingSalarySlipId === slip._id}
                                    >
                                        {downloadingSalarySlipId === slip._id ? (
                                            <span className="spinner"></span>
                                        ) : (
                                            'Download PDF'
                                        )}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="dashboard-section">
                <h3>My Offer Letters</h3>
                {userOfferLetters.length === 0 ? (
                    <p>No offer letters found for your account. Please contact your administrator.</p>
                ) : (
                    <ul className="offer-letter-list">
                        {userOfferLetters.map(letter => (
                            <li key={letter._id} className="offer-letter-item">
                                <div className="offer-letter-info">
                                    <strong>Position: {letter.position}</strong>
                                    <span>Offer Date: {new Date(letter.offerDate).toLocaleDateString()}</span>
                                    <span>Stipend: ₹{letter.stipend ? letter.stipend.toFixed(2) : '0.00'}</span>
                                </div>
                                <div className="offer-letter-actions">
                                    <button
                                        onClick={() => handleDownloadOfferLetter(letter._id, letter.candidateName, letter.offerDate)}
                                        className="download-btn"
                                        disabled={downloadingOfferLetterId === letter._id}
                                    >
                                        {downloadingOfferLetterId === letter._id ? (
                                            <span className="spinner"></span>
                                        ) : (
                                            'Download PDF'
                                        )}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default UserDashboard;
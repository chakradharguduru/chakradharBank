// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './components/signup';
import Admin from './pages/Admin';
import AdminMenu from './pages/AdminMenu';
import Login from './components/login';
import OpenRequests from './components/OpenRequests';
import ServiceRequests from './components/ServiceRequests';
import SetTransferLimit from './pages/SetTransferLimit';
import CustomerMenu from './pages/CustomerMenu';
import ApplyLoan from './pages/ApplyLoan';
import FixedDeposit from './pages/FixedDeposit';
import FDrequest from './components/FDrequest';
import ViewAccounts from './pages/ViewAccounts';
import EditInfo from './pages/EditInfo';
import DepWit from './pages/DepWit';
import TransferWithinBank from './pages/TransferWithinBank';
import TransferToOtherBank from './pages/TransferToOtherBank';
import Transfer from './pages/Transfer'; // Import Transfer component
import CheckIncomingTransactions from './pages/CheckIncomingTransactions'; // Import CheckIncomingTransactions component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> {/* Home route */}
        <Route path="/signup" element={<Signup />} /> {/* Signup route */}
        <Route path="/admin" element={<Admin />} /> {/* Admin route */}
        <Route path="/adminmenu" element={<AdminMenu />} /> {/* AdminMenu route */}
        <Route path="/login" element={<Login />} /> {/* Login route */}
        <Route path="/openrequests" element={<OpenRequests />} /> {/* OpenRequests route */}
        <Route path="/servicerequests" element={<ServiceRequests />} /> {/* ServiceRequests route */}
        <Route path="/settransferlimit" element={<SetTransferLimit />} /> {/* SetTransferLimit route */}
        <Route path="/customermenu" element={<CustomerMenu />} /> {/* CustomerMenu route */}
        <Route path="/applyloan" element={<ApplyLoan />} /> {/* ApplyLoan route */}
        <Route path="/fixeddeposit" element={<FixedDeposit />} /> {/* FixedDeposit route */}
        <Route path="/fdrequest" element={<FDrequest />} /> {/* FDrequest route */}
        <Route path="/viewaccounts" element={<ViewAccounts />} /> {/* ViewAccounts route */}
        <Route path="/editinfo" element={<EditInfo />} /> {/* EditInfo route */}
        <Route path="/depwit" element={<DepWit />} /> {/* DepWit route */}
        <Route path="/transferwithinbank" element={<TransferWithinBank />} /> {/* TransferWithinBank route */}
        <Route path="/transferother" element={<TransferToOtherBank />} /> {/* TransferToOtherBank route */}

        {/* New Routes for Transfer.js and CheckIncomingTransactions.js */}
        <Route path="/transfer" element={<Transfer />} /> {/* Transfer route */}
        <Route path="/check-incoming-transactions" element={<CheckIncomingTransactions />} /> {/* CheckIncomingTransactions route */}
      </Routes>
    </Router>
  );
};

export default App;

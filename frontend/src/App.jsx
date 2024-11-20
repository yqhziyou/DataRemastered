import React from "react";
import Login from "./components/Login.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calculator from "./components/Calculator.jsx";


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/calculator" element={<Calculator />} />
            </Routes>
        </Router>
    );
};

export default App;

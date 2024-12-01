import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StrategyTypeOptions = ['Protective Put', 'Covered Call', 'Cash-Secured Put'];

function App() {
    return (
        <div>
            <h1>Investment Strategies Application</h1>
            <RegisterComponent />
            <CalculateComponent />
            <StockComponent />
            <InsertTransactionComponent />
            <UserInfoComponent />
            <StockListComponent />
            <AuditLogComponent/>
        </div>
    );
}

function RegisterComponent() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try {
            const res = await axios.post('http://localhost:9999/api/register', {
                user_id: userId,
                password: password,
            });
            alert(`User Registered Successfully! User ID: ${res.data.user_id}`);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <input type="text" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Register</button>
        </div>
    );
}

function CalculateComponent() {
    const [strategyType, setStrategyType] = useState('');
    const [strikePrice, setStrikePrice] = useState('');
    const [premium, setPremium] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [response, setResponse] = useState(null);

    const handleCalculate = async () => {
        try {
            const res = await axios.post('http://localhost:9999/api/calculate', {
                strategyType,
                strikePrice: parseFloat(strikePrice),
                premium: parseFloat(premium),
                currentPrice: parseFloat(currentPrice),
            });
            setResponse(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Calculate Strategy</h2>
            <select value={strategyType} onChange={(e) => setStrategyType(e.target.value)}>
                <option value="">Select Strategy Type</option>
                {StrategyTypeOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select>
            <input type="number" placeholder="Strike Price" value={strikePrice} onChange={(e) => setStrikePrice(e.target.value)} />
            <input type="number" placeholder="Premium" value={premium} onChange={(e) => setPremium(e.target.value)} />
            <input type="number" placeholder="Current Price" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} />
            <button onClick={handleCalculate}>Calculate</button>
            {response && (
                <div>
                    <p>{response.message}</p>
                    <p>Breakeven: {response.data.breakeven}</p>
                    <p>Risk Rate: {response.data.riskRate}</p>
                </div>
            )}
        </div>
    );
}

function StockComponent() {
    const [ticker, setTicker] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [response, setResponse] = useState(null);

    const handleAddStock = async () => {
        try {
            const res = await axios.post('http://localhost:9999/api/stock', {
                ticker,
                currentPrice: parseFloat(currentPrice),
                volatility: null,
            });
            setResponse(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Add Stock</h2>
            <input type="text" placeholder="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} />
            <input type="number" placeholder="Current Price" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} />
            <button onClick={handleAddStock}>Add Stock</button>
            {response && <p>Stock ID: {response.stockId}</p>}
        </div>
    );
}

function InsertTransactionComponent() {
    const [userId, setUserId] = useState('');
    const [stockId, setStockId] = useState('');
    const [strategyType, setStrategyType] = useState('');
    const [strikePrice, setStrikePrice] = useState('');
    const [premium, setPremium] = useState('');
    const [maturityTime, setMaturityTime] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [response, setResponse] = useState(null);

    const handleInsertTransaction = async () => {
        try {
            const res = await axios.post('http://localhost:9999/api/insert', {
                userId: parseInt(userId),
                stockId: parseInt(stockId),
                strategyType,
                strikePrice: parseFloat(strikePrice),
                premium: parseFloat(premium),
                maturityTime: parseInt(maturityTime),
                stockQuantity: parseInt(stockQuantity),
            });
            setResponse(res.data);
            if (res.data.transactionId === null) {
                alert('Operation failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Insert Transaction</h2>
            <input type="number" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <input type="number" placeholder="Stock ID" value={stockId} onChange={(e) => setStockId(e.target.value)} />
            <select value={strategyType} onChange={(e) => setStrategyType(e.target.value)}>
                <option value="">Select Strategy Type</option>
                {StrategyTypeOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select>
            <input type="number" placeholder="Strike Price" value={strikePrice} onChange={(e) => setStrikePrice(e.target.value)} />
            <input type="number" placeholder="Premium" value={premium} onChange={(e) => setPremium(e.target.value)} />
            <input type="number" placeholder="Maturity Time" value={maturityTime} onChange={(e) => setMaturityTime(e.target.value)} />
            <input type="number" placeholder="Stock Quantity" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
            <button onClick={handleInsertTransaction}>Insert Transaction</button>
            {response && <p>Transaction ID: {response.transactionId}</p>}
        </div>
    );
}

function UserInfoComponent() {
    const [userId, setUserId] = useState('');
    const [response, setResponse] = useState(null);

    const handleGetUserInfo = async () => {
        try {
            const res = await axios.post('http://localhost:9999/api/info', { userId });
            setResponse(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>User Info</h2>
            <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
            />
            <button onClick={handleGetUserInfo}>Get User Info</button>
            {response && (
                <div>
                    {response.data.map((transaction, index) => (
                        <p key={index}>{transaction.join(', ')}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

function StockListComponent() {
    const [response, setResponse] = useState(null);

    const handleGetStockList = async () => {
        try {
            const res = await axios.get('http://localhost:9999/api/stockList');
            setResponse(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        handleGetStockList();
    }, []);

    return (
        <div>
            <h2>Stock List</h2>
            {response && (
                <div>
                    {response.data.map((stock, index) => (
                        <p key={index}>{stock.join(', ')}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

function AuditLogComponent() {
    const [auditId, setAuditId] = useState('');
    const [response, setResponse] = useState(null);

    const handleGetAuditLog = async () => {
        try {
            const res = await axios.get(`http://localhost:9999/api/audit?id=${auditId}`);
            setResponse(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Audit Log</h2>
            <input type="number" placeholder="Audit ID" value={auditId} onChange={(e) => setAuditId(e.target.value)} />
            <button onClick={handleGetAuditLog}>Get Audit Log</button>
            {response && (
                <div>
                    {response.data.map((audit, index) => (
                        <p key={index}>{audit.join(', ')}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;

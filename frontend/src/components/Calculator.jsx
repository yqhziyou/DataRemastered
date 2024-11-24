import React, { useState } from "react";

const Calculator = () => {
    const [formData, setFormData] = useState({
        userId: "",
        stockId: "",
        strategyType: "",
        strikePrice: "",
        premium: "",
        maturityTime: "",
        stockQuantity: "",
        currentPrice: "",
    });
    const [result, setResult] = useState(null);
    const [auditLog, setAuditLog] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCalculate = async () => {
        try {
            const sanitizedFormData = {
                ...formData,
                userId: Number(formData.userId),
                stockId: Number(formData.stockId),
                strikePrice: Number(formData.strikePrice),
                premium: Number(formData.premium),
                maturityTime: Number(formData.maturityTime),
                stockQuantity: Number(formData.stockQuantity),
                currentPrice: Number(formData.currentPrice),
            };

            if (Object.values(sanitizedFormData).some((value) => value === "" || value === null)) {
                setResult({ success: false, error: "All fields are required" });
                return;
            }

            const response = await fetch("http://localhost:9999/api/calculate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sanitizedFormData),
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: "Network error" });
        }
    };

    const handleFetchAuditLog = async () => {
        if (!formData.userId) {
            setAuditLog({ success: false, error: "User ID is required to fetch audit log" });
            return;
        }

        try {
            const response = await fetch(`http://localhost:9999/api/audit?id=${formData.userId}`);
            const data = await response.json();
            setAuditLog(data);
        } catch (error) {
            setAuditLog({ success: false, error: "Network error while fetching audit log" });
        }
    };

    return (
        <div>
            <h2>Calculate</h2>
            <div style={{ marginBottom: "10px" }}>
                <label htmlFor="userId" style={{ display: "block" }}>
                    User ID
                </label>
                <input
                    id="userId"
                    name="userId"
                    placeholder="Enter user ID"
                    value={formData.userId}
                    onChange={handleChange}
                    type="number"
                    style={{ padding: "5px", width: "100%" }}
                />
            </div>
            <div style={{ marginBottom: "10px" }}>
                <label htmlFor="stockId" style={{ display: "block" }}>
                    Stock ID
                </label>
                <input
                    id="stockId"
                    name="stockId"
                    placeholder="Enter stock ID"
                    value={formData.stockId}
                    onChange={handleChange}
                    type="number"
                    style={{ padding: "5px", width: "100%" }}
                />
            </div>
            <div style={{ marginBottom: "10px" }}>
                <label htmlFor="strategyType" style={{ display: "block" }}>
                    Strategy Type
                </label>
                <select
                    id="strategyType"
                    name="strategyType"
                    value={formData.strategyType}
                    onChange={handleChange}
                    style={{ padding: "5px", width: "100%" }}
                >
                    <option value="" disabled>
                        Select Strategy
                    </option>
                    <option value="Protective Put">Protective Put</option>
                    <option value="Covered Call">Covered Call</option>
                    <option value="Cash-Secured Put">Cash-Secured Put</option>
                </select>
            </div>
            {["strikePrice", "premium", "maturityTime", "stockQuantity", "currentPrice"].map(
                (field) => (
                    <div key={field} style={{ marginBottom: "10px" }}>
                        <label htmlFor={field} style={{ display: "block" }}>
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}
                        </label>
                        <input
                            id={field}
                            name={field}
                            placeholder={`Enter ${field}`}
                            value={formData[field]}
                            onChange={handleChange}
                            type="number"
                            style={{ padding: "5px", width: "100%" }}
                        />
                    </div>
                )
            )}
            <button onClick={handleCalculate} style={{ padding: "10px 20px", marginTop: "10px" }}>
                Calculate
            </button>
            <button onClick={handleFetchAuditLog} style={{ padding: "10px 20px", marginLeft: "10px", marginTop: "10px" }}>
                Fetch Audit Log
            </button>
            {result && (
                <div style={{ marginTop: "20px" }}>
                    <p>Success: {result.success ? "Yes" : "No"}</p>
                    <p>Message: {result.message || result.error}</p>
                    {result.data && <pre>{JSON.stringify(result.data, null, 2)}</pre>}
                </div>
            )}
            {auditLog && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Audit Log</h3>
                    {auditLog.success ? (
                        <table style={{ width: "100%", border: "1px solid black" }}>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Action</th>
                                <th>Table</th>
                                <th>Timestamp</th>
                                <th>User ID</th>
                            </tr>
                            </thead>
                            <tbody>
                            {auditLog.data.map(([id, action, table, timestamp, userId]) => (
                                <tr key={id}>
                                    <td>{id}</td>
                                    <td>{action}</td>
                                    <td>{table}</td>
                                    <td>{new Date(timestamp).toLocaleString()}</td>
                                    <td>{userId}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Error: {auditLog.error}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Calculator;

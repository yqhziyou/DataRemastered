import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState(null);
    const navigate = useNavigate();

    const handleAction = async (action) => {
        const endpoint = action === "login" ? "/api/login" : "/api/register";
        try {
            const response = await fetch(`http://localhost:9999${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: userId, password }),
            });

            const data = await response.json();
            setResult(data);

            if (action === "login" && data.success) {
                // after login, navigate to the calculator page
                navigate("/calculator");
            } else if (!data.success) {
                // display the error message
                setResult({ success: false, message: data.message || "Operation failed" });
            }
        } catch (error) {
            // catch the network error
            setResult({ success: false, error: "Network error" });
        }
    };

    return (
        <div>
            <h2>Login or Register</h2>
            <input
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => handleAction("login")}>Login</button>
            <button onClick={() => handleAction("register")}>Register</button>
            {result && (
                <div>
                    <p>Success: {result.success ? "Yes" : "No"}</p>
                    <p>Message: {result.message || result.error}</p>
                </div>
            )}
        </div>
    );
};

export default Login;

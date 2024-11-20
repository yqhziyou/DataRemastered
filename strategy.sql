-- **1. Create Tables**
CREATE TABLE users (
                       user_id NUMBER PRIMARY KEY,
                       password VARCHAR2(255) NOT NULL,
                       username VARCHAR2(50) DEFAULT 'unknown' NOT NULL,
                       email VARCHAR2(100) DEFAULT 'unknown' NOT NULL,
                       created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE stocks (
                        stock_id NUMBER PRIMARY KEY,
                        ticker VARCHAR2(10) UNIQUE NOT NULL,
                        current_price NUMBER(10,2) NOT NULL,
                        volatility NUMBER(5,2) NOT NULL,
                        updated_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE strategies (
                            strategy_id NUMBER PRIMARY KEY,
                            strategy_name VARCHAR2(50) NOT NULL,
                            description VARCHAR2(255)
);

CREATE TABLE transactions (
                              transaction_id NUMBER PRIMARY KEY,
                              user_id NUMBER REFERENCES users(user_id),
                              stock_id NUMBER REFERENCES stocks(stock_id),
                              strategy_type VARCHAR2(50) CHECK (strategy_type IN ('Protective Put', 'Covered Call', 'Cash-Secured Put')),
                              strike_price NUMBER(10,2) NOT NULL,
                              premium NUMBER(10,2) NOT NULL,
                              maturity_time NUMBER(5,2) NOT NULL,
                              stock_quantity NUMBER NOT NULL,
                              created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE audit_logs (
                            log_id NUMBER PRIMARY KEY,
                            action VARCHAR2(50) NOT NULL,
                            table_name VARCHAR2(50) NOT NULL,
                            timestamp TIMESTAMP DEFAULT SYSTIMESTAMP,
                            user_id NUMBER REFERENCES users(user_id)
);

-- **2. Create Sequences**
CREATE SEQUENCE seq_transaction_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit_log_id START WITH 1 INCREMENT BY 1;

-- **3. Create Triggers**
CREATE OR REPLACE TRIGGER trg_transaction_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
BEGIN
    :NEW.transaction_id := seq_transaction_id.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_audit_logs
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (log_id, action, table_name, timestamp, user_id)
    VALUES (seq_audit_log_id.NEXTVAL, 'INSERT', 'transactions', SYSTIMESTAMP, :NEW.user_id);
END;
/

-- **4. Create Indexes**
CREATE INDEX idx_transaction_time ON transactions(created_at);

-- **5. Create Procedures**
CREATE OR REPLACE PROCEDURE insert_transaction (
    p_user_id NUMBER,
    p_stock_id NUMBER,
    p_strategy_type VARCHAR2,
    p_strike_price NUMBER,
    p_premium NUMBER,
    p_maturity_time NUMBER,
    p_stock_quantity NUMBER,
    p_transaction_id OUT NUMBER
)
    IS
BEGIN
    INSERT INTO transactions (user_id, stock_id, strategy_type, strike_price, premium, maturity_time, stock_quantity, created_at)
    VALUES (p_user_id, p_stock_id, p_strategy_type, p_strike_price, p_premium, p_maturity_time, p_stock_quantity, SYSTIMESTAMP)
    RETURNING transaction_id INTO p_transaction_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_transaction_id := NULL;
        DBMS_OUTPUT.PUT_LINE('Error inserting transaction: ' || SQLERRM);
END;
/

CREATE OR REPLACE PROCEDURE get_user_transactions (
    p_user_id NUMBER,
    p_result OUT SYS_REFCURSOR
)
    IS
BEGIN
    OPEN p_result FOR
        SELECT transaction_id, strategy_type, strike_price, premium, stock_quantity, created_at
        FROM transactions
        WHERE user_id = p_user_id;
END;
/


-- **7. Create Package**
CREATE OR REPLACE PACKAGE transaction_pkg IS
    PROCEDURE insert_transaction (
        p_user_id NUMBER,
        p_stock_id NUMBER,
        p_strategy_type VARCHAR2,
        p_strike_price NUMBER,
        p_premium NUMBER,
        p_maturity_time NUMBER,
        p_stock_quantity NUMBER,
        p_transaction_id OUT NUMBER
    );
    PROCEDURE get_user_transactions (
        p_user_id NUMBER,
        p_result OUT SYS_REFCURSOR
    );
    FUNCTION calculate_breakeven (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER;
    FUNCTION calculate_strategy_value (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER;
    FUNCTION calculate_risk_rate (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER; -- 在这里声明 calculate_risk_rate
END transaction_pkg;
/

/

CREATE OR REPLACE PACKAGE BODY transaction_pkg IS
    PROCEDURE insert_transaction (
        p_user_id NUMBER,
        p_stock_id NUMBER,
        p_strategy_type VARCHAR2,
        p_strike_price NUMBER,
        p_premium NUMBER,
        p_maturity_time NUMBER,
        p_stock_quantity NUMBER,
        p_transaction_id OUT NUMBER
    ) IS
    BEGIN
        INSERT INTO transactions (user_id, stock_id, strategy_type, strike_price, premium, maturity_time, stock_quantity, created_at)
        VALUES (p_user_id, p_stock_id, p_strategy_type, p_strike_price, p_premium, p_maturity_time, p_stock_quantity, SYSTIMESTAMP)
        RETURNING transaction_id INTO p_transaction_id;

        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_transaction_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Error inserting transaction: ' || SQLERRM);
    END insert_transaction;

    PROCEDURE get_user_transactions (
        p_user_id NUMBER,
        p_result OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_result FOR
            SELECT transaction_id, strategy_type, strike_price, premium, stock_quantity, created_at
            FROM transactions
            WHERE user_id = p_user_id;
    END get_user_transactions;

    FUNCTION calculate_breakeven (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER IS
    BEGIN
        CASE p_strategy_type
            WHEN 'Protective Put' THEN
                -- For Protective Put, breakeven = Strike Price + Premium
                RETURN p_strike_price + p_premium;
            WHEN 'Covered Call' THEN
                -- For Covered Call, breakeven = Purchase Price - Premium
                RETURN p_current_price - p_premium;
            WHEN 'Cash-Secured Put' THEN
                -- For Cash-Secured Put, breakeven = Strike Price - Premium
                RETURN p_strike_price - p_premium;
            ELSE
                RETURN NULL; -- Return NULL if strategy type is invalid
            END CASE;
    END calculate_breakeven;


    FUNCTION calculate_strategy_value (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER IS
    BEGIN
        CASE p_strategy_type
            WHEN 'Protective Put' THEN
                RETURN p_strike_price - p_current_price + p_premium;
            WHEN 'Covered Call' THEN
                RETURN p_current_price - p_strike_price + p_premium;
            WHEN 'Cash-Secured Put' THEN
                RETURN p_strike_price - p_premium;
            ELSE
                RETURN NULL;
            END CASE;
    END calculate_strategy_value;

    FUNCTION calculate_risk_rate (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER IS
    BEGIN
        CASE p_strategy_type
            WHEN 'Protective Put' THEN
                RETURN (p_strike_price - p_current_price + p_premium) / p_current_price;
            WHEN 'Covered Call' THEN
                RETURN (p_current_price - p_strike_price + p_premium) / p_current_price;
            WHEN 'Cash-Secured Put' THEN
                RETURN (p_strike_price - p_premium) / p_current_price;
            ELSE
                RETURN NULL;
            END CASE;
    END calculate_risk_rate;
END transaction_pkg;
/





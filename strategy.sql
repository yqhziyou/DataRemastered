-- Create Sequences
CREATE SEQUENCE seq_stock_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_transaction_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit_log_id START WITH 1 INCREMENT BY 1;

-- Create Tables
CREATE TABLE users (
                       user_id NUMBER PRIMARY KEY,
                       password VARCHAR2(255) NOT NULL,
                       username VARCHAR2(50) DEFAULT 'unknown' NOT NULL,
                       email VARCHAR2(100) DEFAULT 'unknown' NOT NULL,
                       created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

ALTER TABLE users
    ADD role VARCHAR2(20) DEFAULT 'User' NOT NULL;

CREATE TABLE stocks (
                        stock_id NUMBER PRIMARY KEY,
                        ticker VARCHAR2(10) UNIQUE NOT NULL,
                        current_price NUMBER(10,2) NOT NULL,
                        volatility NUMBER(5,2) DEFAULT 0.00,
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



-- Create Triggers
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

-- Create Indexes
CREATE INDEX idx_transaction_time ON transactions(created_at);

-- Create Procedures
CREATE OR REPLACE PROCEDURE insert_transaction (
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
END;
/

CREATE OR REPLACE PROCEDURE get_user_transactions (
    p_user_id NUMBER,
    p_result OUT SYS_REFCURSOR
) IS
BEGIN
    OPEN p_result FOR
        SELECT transaction_id, strategy_type, strike_price, premium, stock_quantity, created_at
        FROM transactions
        WHERE user_id = p_user_id;
END;
/

CREATE OR REPLACE PROCEDURE upsert_stock (
    p_ticker VARCHAR2,
    p_current_price NUMBER,
    p_volatility NUMBER,
    p_stock_id OUT NUMBER
) IS
BEGIN
    -- Check if the record exists
    SELECT stock_id INTO p_stock_id
    FROM stocks
    WHERE ticker = p_ticker;

    -- Update if it exists
    UPDATE stocks
    SET current_price = p_current_price,
        volatility = p_volatility,
        updated_at = SYSTIMESTAMP
    WHERE stock_id = p_stock_id;

    DBMS_OUTPUT.PUT_LINE('Stock updated with ID: ' || p_stock_id);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Insert if it does not exist
        INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
        VALUES (seq_stock_id.NEXTVAL, p_ticker, p_current_price, p_volatility, SYSTIMESTAMP)
        RETURNING stock_id INTO p_stock_id;

        DBMS_OUTPUT.PUT_LINE('New stock inserted with ID: ' || p_stock_id);
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error in upsert_stock procedure: ' || SQLERRM);
        RAISE;
END;
/

-- Create Package
CREATE OR REPLACE PACKAGE transaction_pkg IS
    current_user_role VARCHAR2(20);

    PROCEDURE set_current_user_role (p_user_id NUMBER);
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
    PROCEDURE get_user_transactions (p_user_id NUMBER, p_result OUT SYS_REFCURSOR);
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
    ) RETURN NUMBER;
    PROCEDURE get_all_audit_logs (p_result OUT SYS_REFCURSOR);
END transaction_pkg;
/

CREATE OR REPLACE PACKAGE BODY transaction_pkg IS
    PROCEDURE set_current_user_role (p_user_id NUMBER) IS
    BEGIN
        SELECT role INTO current_user_role
        FROM users
        WHERE user_id = p_user_id;

        DBMS_OUTPUT.PUT_LINE('User role set to: ' || current_user_role);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('No user found with the provided ID.');
            current_user_role := NULL;
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error setting user role: ' || SQLERRM);
            current_user_role := NULL;
    END;

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
    END;

    PROCEDURE get_user_transactions (p_user_id NUMBER, p_result OUT SYS_REFCURSOR) IS
    BEGIN
        OPEN p_result FOR
            SELECT transaction_id, strategy_type, strike_price, premium, stock_quantity, created_at
            FROM transactions
            WHERE user_id = p_user_id;
    END;

    FUNCTION calculate_breakeven (
        p_strategy_type VARCHAR2,
        p_current_price NUMBER,
        p_strike_price NUMBER,
        p_premium NUMBER
    ) RETURN NUMBER IS
    BEGIN
        CASE p_strategy_type
            WHEN 'Protective Put' THEN
                RETURN p_strike_price + p_premium;
            WHEN 'Covered Call' THEN
                RETURN p_current_price - p_premium;
            WHEN 'Cash-Secured Put' THEN
                RETURN p_strike_price - p_premium;
            ELSE
                RETURN NULL;
            END CASE;
    END;

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
    END;

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
    END;

    PROCEDURE get_all_audit_logs (p_result OUT SYS_REFCURSOR) IS
    BEGIN
        IF current_user_role = 'Admin' THEN
            OPEN p_result FOR
                SELECT * FROM audit_logs;
        ELSE
            DBMS_OUTPUT.PUT_LINE('Access Denied: Only Admin can view audit logs.');
            RAISE_APPLICATION_ERROR(-20001, 'Access Denied: Only Admin can view audit logs.');
        END IF;
    END;
END transaction_pkg;
/
INSERT INTO users (user_id, password, username, email, created_at,role)
VALUES (9999,9999,'admin','yqhziyou13@gmail.com',SYSTIMESTAMP,'Admin');
INSERT INTO strategies (strategy_id, strategy_name, description) VALUES (1, 'Protective Put', 'Protective put strategy');
INSERT INTO strategies (strategy_id, strategy_name, description) VALUES (2, 'Covered Call', 'Covered call strategy');
INSERT INTO strategies (strategy_id, strategy_name, description) VALUES (3, 'Cash-Secured Put', 'Cash-secured put strategy');

INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
VALUES (1, 'AAPL', 150.50, 0.25, SYSTIMESTAMP);

INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
VALUES (2, 'GOOGL', 2750.75, 0.18, SYSTIMESTAMP);

INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
VALUES (3, 'AMZN', 3500.20, 0.30, SYSTIMESTAMP);
commit;
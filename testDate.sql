INSERT INTO users (user_id, password, username, email, created_at)
VALUES (1, 'password123', 'john_doe', 'john.doe@example.com', SYSTIMESTAMP);

INSERT INTO users (user_id, password, username, email, created_at)
VALUES (2, 'securepassword', 'jane_smith', 'jane.smith@example.com', SYSTIMESTAMP);
INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
VALUES (1, 'AAPL', 150.50, 0.25, SYSTIMESTAMP);

INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
VALUES (2, 'GOOGL', 2750.75, 0.18, SYSTIMESTAMP);

INSERT INTO stocks (stock_id, ticker, current_price, volatility, updated_at)
VALUES (3, 'AMZN', 3500.20, 0.30, SYSTIMESTAMP);
INSERT INTO strategies (strategy_id, strategy_name, description)
VALUES (1, 'Protective Put', 'A strategy to hedge against potential losses on a stock position.');

INSERT INTO strategies (strategy_id, strategy_name, description)
VALUES (2, 'Covered Call', 'A strategy where an investor holds a long position in a stock and sells call options.');

INSERT INTO strategies (strategy_id, strategy_name, description)
VALUES (3, 'Cash-Secured Put', 'A strategy where an investor sells a put option while keeping enough cash to buy the stock if assigned.');

INSERT INTO transactions (transaction_id, user_id, stock_id, strategy_type, strike_price, premium, maturity_time, stock_quantity, created_at)
VALUES (seq_transaction_id.NEXTVAL, 1, 1, 'Protective Put', 145.00, 5.00, 30, 100, SYSTIMESTAMP);

INSERT INTO transactions (transaction_id, user_id, stock_id, strategy_type, strike_price, premium, maturity_time, stock_quantity, created_at)
VALUES (seq_transaction_id.NEXTVAL, 2, 2, 'Covered Call', 2800.00, 50.00, 60, 50, SYSTIMESTAMP);

INSERT INTO transactions (transaction_id, user_id, stock_id, strategy_type, strike_price, premium, maturity_time, stock_quantity, created_at)
VALUES (seq_transaction_id.NEXTVAL, 1, 3, 'Cash-Secured Put', 3400.00, 40.00, 90, 75, SYSTIMESTAMP);

INSERT INTO audit_logs (log_id, action, table_name, timestamp, user_id)
VALUES (seq_audit_log_id.NEXTVAL, 'INSERT', 'transactions', SYSTIMESTAMP, 1);

INSERT INTO audit_logs (log_id, action, table_name, timestamp, user_id)
VALUES (seq_audit_log_id.NEXTVAL, 'INSERT', 'transactions', SYSTIMESTAMP, 2);



INSERT INTO users (user_id, password, username, email, created_at,role)
VALUES (9999,9999,'admin','yqhziyou13@gmail.com',SYSTIMESTAMP,'Admin');
commit;
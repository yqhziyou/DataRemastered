-- Package specification for user role management and permission validation
CREATE OR REPLACE PACKAGE auth_pkg IS
    g_user_role VARCHAR2(20); -- Global variable to store the user role

    PROCEDURE set_user_role(p_user_id NUMBER); -- Set the user's role based on their user ID

    FUNCTION has_permission(p_required_role VARCHAR2) RETURN BOOLEAN; -- Check if the user has the required permission
END auth_pkg;
/

-- Package body implementation
CREATE OR REPLACE PACKAGE BODY auth_pkg IS

    -- Procedure to set the user's role
    PROCEDURE set_user_role(p_user_id NUMBER) IS
    BEGIN
        -- Fetch the role for the given user ID and store it in the global variable
        SELECT role INTO g_user_role
        FROM users
        WHERE user_id = p_user_id;

        DBMS_OUTPUT.PUT_LINE('User role set to: ' || g_user_role); -- Output for debugging purposes
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Handle cases where the user ID does not exist
            g_user_role := NULL;
            DBMS_OUTPUT.PUT_LINE('User not found.');
    END set_user_role;

    -- Function to check if the user has the required role
    FUNCTION has_permission(p_required_role VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        -- Compare the required role with the user's current role
        RETURN g_user_role = p_required_role;
    END has_permission;

END auth_pkg;
/

-- Create a view to display audit log information
CREATE OR REPLACE VIEW audit_log_view AS
SELECT
    al.log_id,
    al.action,
    al.table_name,
    al.timestamp,
    al.user_id,
    u.username,
    u.email
FROM
    audit_logs al
        LEFT JOIN
    users u
    ON
        al.user_id = u.user_id;
/

-- Procedure to fetch audit logs with role-based access control
CREATE OR REPLACE PROCEDURE get_audit_logs (
    p_user_id NUMBER,            -- Input: User ID of the requesting user
    p_result OUT SYS_REFCURSOR   -- Output: Result set of audit logs
)
    IS
BEGIN
    -- Set the user's role using their user ID
    auth_pkg.set_user_role(p_user_id);

    -- Check if the user has Admin permissions
    IF NOT auth_pkg.has_permission('Admin') THEN
        RAISE_APPLICATION_ERROR(-20001, 'Access denied: You do not have sufficient permissions.');
    END IF;

    -- If permission is granted, fetch audit log data
    OPEN p_result FOR
        SELECT *
        FROM audit_log_view;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Handle cases where the user ID is not found
        RAISE_APPLICATION_ERROR(-20002, 'User ID not found. Unable to set role.');
    WHEN OTHERS THEN
        -- Handle any other unexpected errors
        RAISE_APPLICATION_ERROR(-20003, 'An unexpected error occurred: ' || SQLERRM);
END;
/

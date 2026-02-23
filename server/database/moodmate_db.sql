CREATE OR REPLACE FUNCTION get_mood_logs_by_user(p_user_id INTEGER)
RETURNS SETOF mood_logs AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM mood_logs 
    WHERE user_id = p_user_id 
    ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql;
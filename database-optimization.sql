-- FairGo Platform Database Schema Optimization

-- Create optimized indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_available ON drivers(is_available) WHERE is_available = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_created_at ON drivers(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_driver_status ON bookings(driver_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_scheduled_time ON bookings(scheduled_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_pickup_location ON bookings USING GIST(pickup_location);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Add composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_driver_date ON bookings(driver_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_date ON payments(user_id, created_at DESC);

-- Performance tuning parameters
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Enable query plan optimization
ALTER SYSTEM SET enable_partitionwise_join = on;
ALTER SYSTEM SET enable_partitionwise_aggregate = on;

-- Connection pooling settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Reload configuration
SELECT pg_reload_conf();

-- Create partitioned tables for large datasets (optional)
-- Partition bookings by date for better performance on large datasets
-- This is commented out but can be implemented if needed

/*
-- Create partitioned bookings table (only if current table is very large)
CREATE TABLE bookings_partitioned (
    LIKE bookings INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE bookings_2023_01 PARTITION OF bookings_partitioned
    FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');
    
CREATE TABLE bookings_2023_02 PARTITION OF bookings_partitioned
    FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');

-- Add more partitions as needed...

-- Migration script to move data (run carefully in production)
-- INSERT INTO bookings_partitioned SELECT * FROM bookings;
-- ALTER TABLE bookings RENAME TO bookings_old;
-- ALTER TABLE bookings_partitioned RENAME TO bookings;
*/

-- Create materialized views for common aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS driver_stats AS
SELECT 
    d.id as driver_id,
    u.name as driver_name,
    COUNT(b.id) as total_rides,
    AVG(b.fare) as avg_fare,
    SUM(b.fare) as total_earnings,
    AVG(EXTRACT(EPOCH FROM (b.completed_at - b.created_at))/60) as avg_trip_duration,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::DECIMAL / NULLIF(COUNT(b.id), 0) as completion_rate,
    AVG(r.rating) as avg_rating,
    MAX(b.created_at) as last_ride_date
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN bookings b ON d.id = b.driver_id
LEFT JOIN reviews r ON b.id = r.booking_id AND r.reviewer_type = 'user'
GROUP BY d.id, u.name;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_driver_stats_driver_id ON driver_stats(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_stats_total_rides ON driver_stats(total_rides DESC);
CREATE INDEX IF NOT EXISTS idx_driver_stats_avg_rating ON driver_stats(avg_rating DESC);

-- Refresh materialized view (set up as a scheduled job)
-- REFRESH MATERIALIZED VIEW driver_stats;

-- Daily statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
    SUM(CASE WHEN status = 'completed' THEN fare ELSE 0 END) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN fare END) as avg_fare,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT driver_id) as active_drivers
FROM bookings
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create index on daily stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- Database maintenance functions
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Archive old completed bookings (older than 2 years)
    -- This is commented out for safety, implement based on data retention policy
    /*
    INSERT INTO bookings_archive 
    SELECT * FROM bookings 
    WHERE created_at < NOW() - INTERVAL '2 years' 
    AND status IN ('completed', 'cancelled');
    
    DELETE FROM bookings 
    WHERE created_at < NOW() - INTERVAL '2 years' 
    AND status IN ('completed', 'cancelled');
    */
    
    -- Clean up expired sessions
    DELETE FROM sessions WHERE expires_at < NOW();
    
    -- Clean up old payment intents
    DELETE FROM payment_intents 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND status NOT IN ('succeeded', 'processing');
    
    -- Update statistics
    ANALYZE users, drivers, bookings, payments;
    
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW driver_stats;
    REFRESH MATERIALIZED VIEW daily_stats;
END;
$$ LANGUAGE plpgsql;

-- Database health check function
CREATE OR REPLACE FUNCTION db_health_check()
RETURNS TABLE(
    metric TEXT,
    value TEXT,
    status TEXT
) AS $$
BEGIN
    -- Check database size
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        CASE 
            WHEN pg_database_size(current_database()) < 10737418240 THEN 'OK'::TEXT -- 10GB
            WHEN pg_database_size(current_database()) < 53687091200 THEN 'WARNING'::TEXT -- 50GB
            ELSE 'CRITICAL'::TEXT
        END;
    
    -- Check active connections
    RETURN QUERY
    SELECT 
        'Active Connections'::TEXT,
        count(*)::TEXT,
        CASE 
            WHEN count(*) < 50 THEN 'OK'::TEXT
            WHEN count(*) < 100 THEN 'WARNING'::TEXT
            ELSE 'CRITICAL'::TEXT
        END
    FROM pg_stat_activity
    WHERE state = 'active';
    
    -- Check long-running queries
    RETURN QUERY
    SELECT 
        'Long Running Queries'::TEXT,
        count(*)::TEXT,
        CASE 
            WHEN count(*) = 0 THEN 'OK'::TEXT
            WHEN count(*) < 5 THEN 'WARNING'::TEXT
            ELSE 'CRITICAL'::TEXT
        END
    FROM pg_stat_activity
    WHERE state = 'active' 
    AND now() - query_start > interval '5 minutes';
    
    -- Check table bloat (simplified)
    RETURN QUERY
    SELECT 
        'Table Maintenance Needed'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_stat_user_tables 
                WHERE n_dead_tup > n_live_tup * 0.1
            ) THEN 'Yes'::TEXT
            ELSE 'No'::TEXT
        END,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_stat_user_tables 
                WHERE n_dead_tup > n_live_tup * 0.1
            ) THEN 'WARNING'::TEXT
            ELSE 'OK'::TEXT
        END;
END;
$$ LANGUAGE plpgsql;

-- Create backup verification function
CREATE OR REPLACE FUNCTION verify_backup_integrity(backup_date DATE)
RETURNS TABLE(
    table_name TEXT,
    current_count BIGINT,
    backup_count BIGINT,
    status TEXT
) AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE '%_backup%'
    LOOP
        RETURN QUERY
        EXECUTE format('
            SELECT 
                %L::TEXT,
                (SELECT count(*) FROM %I.%I)::BIGINT,
                COALESCE((SELECT count(*) FROM %I.%I WHERE DATE(created_at) <= %L), 0)::BIGINT,
                CASE 
                    WHEN (SELECT count(*) FROM %I.%I) >= COALESCE((SELECT count(*) FROM %I.%I WHERE DATE(created_at) <= %L), 0) 
                    THEN ''OK''::TEXT
                    ELSE ''ERROR''::TEXT
                END
        ', 
        rec.tablename, 
        rec.schemaname, rec.tablename,
        rec.schemaname, rec.tablename, backup_date,
        rec.schemaname, rec.tablename,
        rec.schemaname, rec.tablename, backup_date);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring queries

-- Query to find slow queries
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Query to find unused indexes
CREATE VIEW unused_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey'
ORDER BY schemaname, tablename, indexname;

-- Query to find tables that need vacuum/analyze
CREATE VIEW maintenance_needed AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_dead_tup,
    n_live_tup,
    CASE 
        WHEN n_dead_tup > n_live_tup * 0.1 THEN 'VACUUM'
        WHEN n_mod_since_analyze > n_live_tup * 0.1 THEN 'ANALYZE'
        ELSE 'OK'
    END as action_needed
FROM pg_stat_user_tables
WHERE n_dead_tup > 100 OR n_mod_since_analyze > 100
ORDER BY n_dead_tup DESC;

-- Create extension for better monitoring (if not exists)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE EXTENSION IF NOT EXISTS pg_buffercache;

COMMENT ON FUNCTION cleanup_old_data() IS 'Performs routine database cleanup and maintenance tasks';
COMMENT ON FUNCTION db_health_check() IS 'Returns database health metrics and status';
COMMENT ON FUNCTION verify_backup_integrity(DATE) IS 'Verifies backup integrity by comparing row counts';

COMMENT ON VIEW slow_queries IS 'Lists the slowest queries by mean execution time';
COMMENT ON VIEW unused_indexes IS 'Lists indexes that have never been used';
COMMENT ON VIEW maintenance_needed IS 'Lists tables that need vacuum or analyze operations';

-- Schedule regular maintenance (example cron job commands)
/*
To set up automated maintenance, add these to your cron:

# Daily cleanup at 2 AM
0 2 * * * psql -d fairgo -c "SELECT cleanup_old_data();"

# Weekly vacuum analyze on Sunday at 3 AM
0 3 * * 0 psql -d fairgo -c "VACUUM ANALYZE;"

# Monthly refresh of materialized views
0 4 1 * * psql -d fairgo -c "REFRESH MATERIALIZED VIEW driver_stats; REFRESH MATERIALIZED VIEW daily_stats;"

# Daily health check
0 6 * * * psql -d fairgo -c "SELECT * FROM db_health_check();" >> /var/log/fairgo/db_health.log
*/
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_status $$

CREATE PROCEDURE sp_get_status (IN machine_ids varchar(255), IN record_count INT, IN timezone varchar(255))
  BEGIN

    set @num := 0,
    @machine_id := '';

    if ( machine_ids IS NOT NULL ) then
      set @where_clause = CONCAT(' where machine_id in (', machine_ids , ') and time_stamp > date_add(now(), interval -5 day)  ');
    else
      set @where_clause = CONCAT(' where 1 = 1 and time_stamp > date_add(now(), interval -5 day)  ');
    end if;

    set @query = CONCAT('
-- Current Status
	select
		a.machine_id,
		a.status_id,
		a.status_message,
		case
			when a.status_code = 0 and b.idle_count < ', record_count, ' then 1
			when a.status_code = 0 and b.idle_count >= ', record_count, ' then 0
			else a.status_code
		end as status_code,
		CONVERT_TZ(a.time_stamp, @@session.time_zone, ''', timezone, ''') as time_stamp
	from
		(
			select
				machine_id,
				status_id,
				status_message,
				status_code,
				time_stamp
			from (
			   select machine_id, status_id, time_stamp, status_code, status_message,
				  @num := if(@machine_id = machine_id, @num + 1, 1) as row_number,
				  @machine_id := machine_id as dummy
			  from xeros_status',
                        @where_clause,
                        'order by machine_id, time_stamp DESC
                      ) as x
                      where
                        x.row_number = 1
                    ) as a
                  left join
                    (
                        select machine_id, count(*) as idle_count
                    from (
                       select machine_id, status_id, time_stamp, status_code, status_message,
                        @num := if(@machine_id = machine_id, @num + 1, 1) as row_number,
                        @machine_id := machine_id as dummy
                      from xeros_status',
                        @where_clause,
                        '
                        and status_code = 0
                        order by machine_id, time_stamp DESC
                      ) as x
                      where
                        x.row_number <= ', record_count, '
		group by
			machine_id
	    ) as b
			on a.machine_id = b.machine_id'
    );

--   select @query;
--
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    END$$

#     call sp_get_status('14,15', 3, 'America/New_York')$$
#     call sp_get_status(NULL, 3, 'America/New_York') $$
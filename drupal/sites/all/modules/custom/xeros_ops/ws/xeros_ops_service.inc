<?php



function service($service_name, $machineIds) {

  switch ($service_name) {
    case 'status':
      $result = get_status('current', $machineIds);
      echo json_encode($result);
      break;
    case 'history':
      $result = get_status(5, $machineIds);
      echo json_encode($result);
      break;
    case 'machines':
      $result = get_machines($machineIds);
      echo json_encode($result, true);
      break;
    case 'usage':
      $result = get_usage();
      echo json_encode($result);
      break;
    case 'cycles':
      $result = get_cycles($machineIds);
      echo json_encode($result);
      break;
  }

}

/**
 *
 * Returns the current status of a set of machines.
 *
 * @param $record_count
 * @param $machineIds
 *
 * @return array
 */
function get_status($record_count, $machineIds) {

  /**
   * Number of idle records before we consider something to be out of sync
   */
  $idle_count = 4;

  $timezone = $GLOBALS['user']->timezone;

  $status = false;
  if ($record_count == 'current') {
    $status = true;
    // Configure the idle count
    $record_count = $idle_count;
    $query = "call sp_get_status(" . $machineIds . ", " . $record_count . ", '" . $timezone . "')";
  } else {
    $query = "call sp_get_status_history(" . $machineIds . ", " . $record_count . ", '" . $timezone . "')";
  }

  $result = db_query($query, array());

  //while($result->nextRowSet())
  //{
    $r = $result->fetchAll();
  //}
  $result->closeCursor();

  //$r = $result->fetchAll();

  $a = array();

  foreach ($r as $key => $value) {
    $machine_id = $value->machine_id;
    $status_id = $value->status_id;
    unset($value->machine_id);
    unset($value->status_id);
    if ( $status ) {
      $a[$machine_id] = $value;
    } else {
      $a[$machine_id][$status_id] = $value;
    }
  }

  $a['user_timezone'] = $timezone;

  return $a;
}

/**
 * Get all the machines and their current status
 *
 * This is used for setting up the Ops board showing all the machines.
 *
 * @param $machineIds
 *
 * @return array
 */
function get_machines($machineIds) {

  $query = <<<SQL
    select
	m.machine_id,
	m.serial_number,
	m.manufacturer,
	m.machine_name,
	m.notes,
	m.location_id,
	m.status as machine_status,
	coalesce(l.title, 'Unknown Location') as location_title,
	coalesce(c.title, 'Unknown Company') as company_title
from
    xeros_machine as m
    left join node as l
        on m.location_id = l.nid
        and l.type = 'location'
    left join field_data_field_company as lc
        on l.nid = lc.entity_id
        and lc.bundle = 'location'
    left join node as c
        on lc.field_company_target_id = c.nid
        and c.type = 'company'
    where
        m.status not in ('inactive');

SQL;

  // Machines
  $result = db_query($query, array());
  $r = $result->fetchAll();

  $machines = array();

  // Append the status
  $status = get_status('current', $machineIds);

  // Append the usage
  $usage = get_usage();

  // Merge usage and status with machines
  foreach ($r as $key => $value) {
    $machine_id = $value->machine_id;
    unset($value->machine_id);
    $machines[$machine_id] = $value;
    $machines[$machine_id]->status = $status[$machine_id];

    if ( $usage[$machine_id] == null ) {
      $machines[$machine_id]->usage = array(
        'cycles' => 0,
        'run_time' => 0
      );
    } else {
      $machines[$machine_id]->usage = $usage[$machine_id];
    }
  }

  return $machines;
  //return json_encode($machines);
}

/**
 * This is going to show how many cycles and how many minutes this machine has been used today.
 *
 * @return array
 */
function get_usage() {
  $query = <<<SQL
    SELECT
      machine_id,
      count(*) as cycles,
      sum(cycle_time_run_time) as run_time
    FROM
      xeros_cycle
    WHERE
      reading_timestamp > date(CONVERT_TZ(NOW(), @@session.time_zone, '-06:00'))
    GROUP BY
     machine_id;
SQL;

  $result = db_query($query, array());

  $r = $result->fetchAll();

  $a = array();

  foreach ($r as $key => $value) {
    $machine_id = $value->machine_id;
    unset($value->machine_id);
    $a[$machine_id] = $value;
  }

  return $a;
  //return json_encode($r);
}

/**
 *
 *
 * @param $machineIds
 *
 * @return array
 */
function get_cycles($machineIds) {

  $query = <<<SQL
select
	x.cycle_load_size,
	x.cycle_cold_water_volume,
	x.cycle_hot_water_volume,
    x.cycle_therms,
	x.cycle_chemical_strength,
	x.olson_timezone_id,
	x.reading_timestamp as cycle_end_time, -- Readings are in their local timezone
	date_add(x.reading_timestamp, INTERVAL -x.cycle_time_run_time minute) as cycle_start_time,
	x.cycle_time_run_time,
	x.classification_id,
	x.machine_id,
	xc.name as classification_name,
	x.olson_timezone_id
from
	xeros_cycle AS x
	left join xeros_classification as xc
		on x.classification_id = xc.classification_id
where
	x.reading_timestamp > date(CONVERT_TZ(NOW(), @@session.time_zone, x.olson_timezone_id))
	and x.machine_id in ({{machineIds}})
order by
    x.reading_timestamp desc
SQL;

  $query = str_replace('{{machineIds}}', $machineIds, $query);

  $result = db_query($query, array());

  $r = $result->fetchAll();

  $a = array();

  foreach ($r as $key => $value) {
    $machine_id = $value->machine_id;
    unset($value->machine_id);
    $a[$machine_id][] = $value;
  }

  return $a;

  //return $r;

}
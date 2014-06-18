<?php

require_once dirname(__FILE__) . '/../../xeros_admin/db/orm_abstract.inc';

class dai_meter_collection extends orm_abstract {

  function __construct() {
    $this->table = 'xeros_dai_meter_collection';
    $this->key = 'id';
  }

  public function select_by_location($location_id) {

    $select = db_select($this->table, 'a')
      ->extend('PagerDefault')     //Pager Extender
      ->limit(10)              //10 results per page;
    ;
    $select->leftJoin('xeros_dai_meter_actual', 'b', 'a.dai_meter_actual_id = b.dai_meter_actual_id');

    $select->fields('a', array(
        'id',
        'dai_write_timestamp',
        'machine_identifier',
        'location_identifier',
        'dai_meter_actual_id'
      ));

    $select->fields('b', array(
        'run_time',
        'classification_id',
        'machine_id'
      ));

    if ($location_id != NULL) {
      $select->condition('a.location_identifier', $location_id);
    } else {
      error_log('Location ID not provided');
      drupal_set_message('Location ID not provided');
    }

    $entries = $select->execute()->fetchAll(PDO::FETCH_ASSOC);
    $rows = array();
    if (!empty($entries)) {
      foreach ($entries as $entry) {
        // Sanitize the data before handing it off to the theme layer.
        $rows[] = array_map('check_plain', $entry);
      }
    }
    return $rows;
  }

}
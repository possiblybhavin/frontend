DROP TRIGGER IF EXISTS currency_exchange_create_historical
CREATE TRIGGER currency_exchange_create_historical AFTER INSERT ON currency_exchange_rate_db_table FOR EACH ROW insert into currency_exchange_rate_db_table_revision (currency_code_from,currency_code_to,rate) values (new.currency_code_from, new.currency_code_to,new.rate);

DROP TRIGGER IF EXISTS currency_exchange_update_trigger
CREATE TRIGGER currency_exchange_update_trigger AFTER UPDATE ON currency_exchange_rate_db_table FOR EACH ROW insert into currency_exchange_rate_db_table_revision (currency_code_from,currency_code_to,rate) values (new.currency_code_from, new.currency_code_to,new.rate);
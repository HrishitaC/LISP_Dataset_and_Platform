<?php

ini_set('display_errors', 0);         
ini_set('log_errors', 1);             
error_reporting(E_ALL);               

$host = 'localhost';          
$db   = '';                       // Add the name of your database here
$user = '';                       // Add your username here
$pass = '';                       // Add your password here  
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, 
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       
    PDO::ATTR_EMULATE_PREPARES   => false,                  
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

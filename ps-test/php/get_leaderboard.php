<?php
require 'db.php';

header('Content-Type: application/json'); 
$stmt = $pdo->query("SELECT user_id, score FROM scores ORDER BY score DESC LIMIT 10");
echo json_encode($stmt->fetchAll());


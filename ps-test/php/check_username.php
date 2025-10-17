<?php
require 'db.php';

header('Content-Type: application/json'); 

$userId = $_GET['user_id'] ?? '';

if ($userId === '') {
    http_response_code(400);
    echo json_encode(['error' => 'No user_id specified']);
    exit;
}

$stmt = $pdo->prepare("SELECT 1 FROM scores WHERE user_id = ? LIMIT 1");
$stmt->execute([$userId]);

$available = ($stmt->rowCount() === 0);

echo json_encode(['available' => $available]);

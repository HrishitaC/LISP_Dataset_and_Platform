<?php
require 'db.php';

$userId = $_GET['user_id'] ?? '';

$stmt = $pdo->prepare("SELECT score FROM scores WHERE user_id = ?");
$stmt->execute([$userId]);

$row = $stmt->fetch();
echo json_encode(['score' => $row ? (int)$row['score'] : null]);

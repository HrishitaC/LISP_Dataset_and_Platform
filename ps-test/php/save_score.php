<?php
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['user_id'] ?? '';
$score = $data['score'] ?? '';
$amount_n = $data['amount_n'] ?? '';
$amount_n_correct = $data['amount_n_correct'] ?? '';
$amount_j = $data['amount_j'] ?? '';
$amount_j_correct = $data['amount_j_correct'] ?? '';

if (
    $userId === '' || $score === '' ||
    $amount_n === '' || $amount_n_correct === '' ||
    $amount_j === '' || $amount_j_correct === ''
) {
    http_response_code(400);
    echo 'Missing parameters';
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO scores (user_id, score, amount_n, amount_n_correct, amount_j, amount_j_correct)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        score = VALUES(score),
        amount_n = VALUES(amount_n),
        amount_n_correct = VALUES(amount_n_correct),
        amount_j = VALUES(amount_j),
        amount_j_correct = VALUES(amount_j_correct)
");

$stmt->execute([
    $userId, $score,
    $amount_n, $amount_n_correct,
    $amount_j, $amount_j_correct
]);


echo 'OK';

<?php
// Hostinger Secure PHP Upload Script for Men's Hub
// Saves uploaded images directly inside public_html/media/uploads/ permanently

// Enable CORS for frontend request
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: X-Upload-Secret, Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Security Check to prevent unauthorized uploads
$secret = "Dharshan_MensHub_Secret_2026";

// Method 1: Check standard GET parameter in URL (?secret=...) - 100% guaranteed to bypass server header restrictions
$authHeader = isset($_GET['secret']) ? $_GET['secret'] : '';

// Method 2: Fallback to POST parameter
if (empty($authHeader) && isset($_POST['secret'])) {
    $authHeader = $_POST['secret'];
}

// Method 3: Fallback to HTTP custom headers
if (empty($authHeader)) {
    $headers = getallheaders();
    if ($headers) {
        foreach ($headers as $name => $value) {
            if (strcasecmp($name, 'X-Upload-Secret') === 0) {
                $authHeader = $value;
                break;
            }
        }
    }
}

// Method 4: Fallback to PHP Server HTTP variable
if (empty($authHeader) && isset($_SERVER['HTTP_X_UPLOAD_SECRET'])) {
    $authHeader = $_SERVER['HTTP_X_UPLOAD_SECRET'];
}

if ($authHeader !== $secret) {
    header("HTTP/1.1 401 Unauthorized");
    echo json_encode([
        "error" => "Unauthorized request. Invalid secret key.",
        "debug_header_received" => $authHeader ? "present_but_invalid" : "missing"
    ]);
    exit;
}

if (!isset($_FILES['image'])) {
    header("HTTP/1.1 400 Bad Request");
    echo json_encode(["error" => "No image file provided."]);
    exit;
}

$file = $_FILES['image'];
// Replace spaces with underscores and append timestamp to prevent filename collisions
$cleanName = preg_replace('/[^A-Za-z0-9\.\-_]/', '', str_replace(' ', '_', $file['name']));
$fileName = time() . '_' . $cleanName;
$targetDir = __DIR__ . '/uploads/';

// Ensure directory exists with correct permissions
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$targetFile = $targetDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    echo json_encode([
        "success" => true,
        "image_url" => "/media/uploads/" . $fileName
    ]);
} else {
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode(["error" => "Failed to save the uploaded image on Hostinger server."]);
}
?>

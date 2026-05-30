# Project Cleanup Script - Delete Waste Files
# Running this will free up 2-3 GB of space

Write-Host "Starting Project Cleanup..." -ForegroundColor Cyan
Write-Host "" -ForegroundColor Yellow

$deletedSize = 0
$itemsDeleted = 0

# Function to delete item and track size
function Remove-ItemSafely {
    param(
        [string]$Path,
        [switch]$IsFolder
    )
    
    if (Test-Path $Path) {
        try {
            if ($IsFolder) {
                $size = (Get-ChildItem -Path $Path -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB
                Write-Host "[DELETE] Folder: $Path (~$([Math]::Round($size, 2)) MB)" -ForegroundColor Red
                Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
            } else {
                $size = (Get-Item -Path $Path).Length / 1MB
                Write-Host "[DELETE] File: $Path (~$([Math]::Round($size, 2)) MB)" -ForegroundColor Red
                Remove-Item -Path $Path -Force -ErrorAction SilentlyContinue
            }
            $global:deletedSize += $size
            $global:itemsDeleted += 1
        } catch {
            Write-Host "[SKIP] Could not delete $Path : $_" -ForegroundColor Yellow
        }
    }
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "PRIORITY 1: Large Folders (1-2GB)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Delete .venv (keep venv/ if exists)
if ((Test-Path ".\.venv") -and (Test-Path ".\venv")) {
    Remove-ItemSafely -Path ".\.venv" -IsFolder
} elseif (Test-Path ".\.venv") {
    Write-Host "[SKIP] Keeping .venv as primary venv" -ForegroundColor Yellow
}

# Delete venv folder if .venv exists
if ((Test-Path ".\venv") -and (Test-Path ".\.venv")) {
    Remove-ItemSafely -Path ".\venv" -IsFolder
}

# Delete node_modules
Remove-ItemSafely -Path ".\node_modules" -IsFolder

# Delete dist
Remove-ItemSafely -Path ".\dist" -IsFolder

# Delete tmp
Remove-ItemSafely -Path ".\tmp" -IsFolder

# Delete backend folder (keep backend_project)
if (Test-Path ".\backend") {
    Remove-ItemSafely -Path ".\backend" -IsFolder
}

# Delete db.sqlite3
Remove-ItemSafely -Path ".\db.sqlite3"

Write-Host "" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host "PRIORITY 2: Old Python Test Files" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$testFiles = @(
    "test_admin_persistence.py",
    "test_api.py",
    "test_api_response.py",
    "test_base64.py",
    "test_notification.py",
    "test_orders_api.py",
    "test_persistence_final.py",
    "test_ws.py",
    "quick_test.py",
    "verify_websocket_setup.py"
)

foreach ($file in $testFiles) {
    Remove-ItemSafely -Path ".\$file"
}

Write-Host "" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host "PRIORITY 3: Old Setup/Admin Scripts" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$setupScripts = @(
    "assign_orders_to_user.py",
    "check_db_details.py",
    "check_products.py",
    "create_db.py",
    "create_orders_for_chandra.py",
    "create_placeholder_images.py",
    "create_test_orders.py",
    "debug_orders.py",
    "download_product_images.py",
    "manage_product_images.py",
    "merge_users.py",
    "setup_product_images.py",
    "update_product_urls.py"
)

foreach ($file in $setupScripts) {
    Remove-ItemSafely -Path ".\$file"
}

Write-Host "" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host "PRIORITY 4: Old Documentation Files" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$docFiles = @(
    "IMPLEMENTATION_CHECKLIST.md",
    "IMPLEMENTATION_COMPLETE.md",
    "IMPLEMENTATION_COMPLETE_FINAL.md",
    "IMPLEMENTATION_STATUS.md",
    "IMPLEMENTATION_SUMMARY.md",
    "IMPLEMENTATION_SUMMARY_FINAL.md",
    "QUICK_START.md",
    "QUICK_START_CASHFREE_EXCHANGE.md",
    "QUICK_START_USER_ADMIN.md",
    "START_HERE.md",
    "START_TESTING_NOW.md",
    "STARTUP_GUIDE.md",
    "ADMIN_NOTIFICATION_QUICK_START.md",
    "ADMIN_NOTIFICATION_TAMIL.md",
    "ADMIN_PERMANENT_UPDATES.md",
    "ADMIN_PERSISTENCE_FIX.md",
    "ADMIN_LOGIN_IMPLEMENTATION.md",
    "API_FETCH_TROUBLESHOOTING.md",
    "API_INTEGRATION_GUIDE.md",
    "GOOGLE_LOGIN_QUICK_FIX.md",
    "GOOGLE_LOGIN_QUICK_FIX_SHORT.md",
    "GOOGLE_OAUTH_FIX.md",
    "GOOGLE_OAUTH_IMPLEMENTATION.md",
    "GOOGLE_OAUTH_ORIGIN_FIX.md",
    "GOOGLE_OAUTH_QUICK_FIX_LOCALHOST.md",
    "GOOGLE_OAUTH_SETUP.md",
    "BACKEND_README.md",
    "BACKEND_SETUP.md",
    "DATABASE_ARCHITECTURE.md",
    "CASHFREE_EXCHANGE_COMPLETE.md",
    "CASHFREE_EXCHANGE_FRONTEND_GUIDE.md",
    "CASHFREE_EXCHANGE_SETUP.md",
    "VERIFICATION_GUIDE.md",
    "TEST_MODE_READY.md",
    "TESTING_GUIDE_MULTI_TAB.md",
    "TESTING_QUICK_START.md",
    "TWO_TAB_TESTING_GUIDE.md",
    "WEBSOCKET_CHANGES_SUMMARY.md",
    "WEBSOCKET_DEBUGGING_GUIDE.md",
    "WEBSOCKET_DOCUMENTATION_INDEX.md",
    "WEBSOCKET_FIX_CHECKLIST.md",
    "WEBSOCKET_IMMEDIATE_FIX.md",
    "WEBSOCKET_NOTIFICATION_QUICK_START.md",
    "WEBSOCKET_SYSTEM_COMPLETE.md",
    "MIGRATION_GUIDE.md",
    "MIGRATION_VERIFICATION.md",
    "VERCEL_PYTHONANYWHERE_INTEGRATION_GUIDE.md",
    "PERMANENT_DATA_STORAGE_GUIDE.md",
    "PERMANENT_STORAGE_FIX.md",
    "PERMANENT_STORAGE_TEST_GUIDE.md",
    "PERSISTENCE_FIX.md",
    "PERSISTENCE_STATUS.md",
    "MYSQL_COMPLETE.md",
    "MYSQL_DATABASE_SETUP.md",
    "MYSQL_PERMANENT_STORAGE_GUIDE.md",
    "MYSQL_QUICK_REFERENCE.md",
    "MYSQL_SETUP_COMPLETE.md",
    "NOTIFICATION_SYSTEM_COMPLETE.md",
    "NOTIFICATIONS_QUICK_REFERENCE.md",
    "REALTIME_NOTIFICATIONS_SETUP.md",
    "USER_SPECIFIC_ADMIN_COMPLETE.md",
    "USER_SPECIFIC_ADMIN_GUIDE.md",
    "MULTI_TAB_ADMIN_FIX.md",
    "IMAGES_COMPLETE.md",
    "IMAGES_UPDATE_SUMMARY.md",
    "IMAGE_URLS_QUICK_REFERENCE.md",
    "PRODUCT_IMAGES_COMPLETE.md",
    "PRODUCT_IMAGES_GUIDE.md",
    "PRODUCT_IMAGES_IMPLEMENTATION.md",
    "PRODUCT_IMAGES_SETUP_GUIDE.md",
    "PRODUCT_SERVICE_UPDATED.md",
    "CHANGES_SUMMARY.md",
    "FILES_CREATED.md",
    "FILE_INVENTORY.md",
    "DEPLOYMENT_COMMANDS_REFERENCE.md",
    "DOCUMENTATION_INDEX.md",
    "ATTRIBUTIONS.md",
    "default_shadcn_theme.css"
)

foreach ($file in $docFiles) {
    Remove-ItemSafely -Path ".\$file"
}

Write-Host "" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Stats:" -ForegroundColor Cyan
Write-Host "   Items Deleted: $itemsDeleted" -ForegroundColor White
Write-Host "   Space Freed: ~$([Math]::Round($deletedSize, 2)) MB" -ForegroundColor White
Write-Host "" -ForegroundColor Green
Write-Host "Project is now clean and ready!" -ForegroundColor Green

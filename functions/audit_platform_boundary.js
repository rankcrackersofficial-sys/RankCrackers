const fs = require('fs');
const path = require('path');

function main() {
    console.log("=========================================");
    console.log("PLATFORM BOUNDARY REGRESSION AUDIT");
    console.log("=========================================");

    const errors = [];

    // 1. main_web.dart exists
    const mainWebPath = path.join(__dirname, '../lib/main_web.dart');
    if (!fs.existsSync(mainWebPath)) {
        errors.push("lib/main_web.dart does not exist.");
    } else {
        console.log("✅ Check 1: lib/main_web.dart exists.");
        // 2. main_web.dart imports/loads WebShell or UnifiedCommandConsole
        const mainWebContent = fs.readFileSync(mainWebPath, 'utf8');
        if (!mainWebContent.includes("WebShell") && !mainWebContent.includes("UnifiedCommandConsole")) {
            errors.push("lib/main_web.dart does not import/load WebShell or UnifiedCommandConsole.");
        } else {
            console.log("✅ Check 2: lib/main_web.dart imports/loads WebShell/UnifiedCommandConsole.");
        }
    }

    // 3. main.dart does not route Founder/Admin to mobile AdminScreen
    const appRouterPath = path.join(__dirname, '../lib/core/router/app_router.dart');
    if (!fs.existsSync(appRouterPath)) {
        errors.push("lib/core/router/app_router.dart does not exist.");
    } else {
        const appRouterContent = fs.readFileSync(appRouterPath, 'utf8');
        const hasActiveAdminRedirect = appRouterContent.includes("return AppRoutes.admin;") && 
            !appRouterContent.match(/\/\*\s*[\s\S]*?return AppRoutes\.admin;[\s\S]*?\*\//);
        if (hasActiveAdminRedirect) {
            errors.push("lib/core/router/app_router.dart actively redirects users to AppRoutes.admin.");
        } else {
            console.log("✅ Check 3: lib/core/router/app_router.dart does not route Founder/Admin to mobile AdminScreen.");
        }

        // 5. AppRoutes.admin does not render mobile admin panel
        if (appRouterContent.includes("builder: (context, state) => const AdminScreen()")) {
            errors.push("lib/core/router/app_router.dart still renders const AdminScreen() for AppRoutes.admin.");
        } else if (!appRouterContent.includes("Access Denied: Mobile Admin Console is disabled.")) {
            errors.push("lib/core/router/app_router.dart does not show correct placeholder for AppRoutes.admin.");
        } else {
            console.log("✅ Check 5: AppRoutes.admin does not render AdminScreen (shows placeholder).");
        }
    }

    // 4. legacy admin_screen.dart may exist, but mobile routing must not import or render it.
    if (fs.existsSync(appRouterPath)) {
        const appRouterContent = fs.readFileSync(appRouterPath, 'utf8');
        const importsMobileAdminScreen = appRouterContent.includes("features/admin/presentation/screens/admin_screen.dart");
        const rendersMobileAdminScreen = appRouterContent.includes("AdminScreen()");
        if (importsMobileAdminScreen || rendersMobileAdminScreen) {
            errors.push("lib/core/router/app_router.dart still actively imports/renders mobile AdminScreen.");
        } else {
            console.log("✅ Check 4: legacy admin_screen.dart is not active in app_router.dart.");
        }
    }

    // 6. student_mission_catalog query still exists in firestore_service.dart
    const firestoreServicePath = path.join(__dirname, '../lib/core/firebase/firestore_service.dart');
    if (!fs.existsSync(firestoreServicePath)) {
        errors.push("lib/core/firebase/firestore_service.dart does not exist.");
    } else {
        const serviceContent = fs.readFileSync(firestoreServicePath, 'utf8');
        if (!serviceContent.includes("student_mission_catalog")) {
            errors.push("lib/core/firebase/firestore_service.dart does not reference student_mission_catalog.");
        } else {
            console.log("✅ Check 6: student_mission_catalog query exists in firestore_service.dart.");
        }
    }

    // 7. create_mission_dialog.dart still mirrors to student_mission_catalog
    const createDialogPath = path.join(__dirname, '../lib/web/founder/mission_control/create_mission_dialog.dart');
    if (!fs.existsSync(createDialogPath)) {
        errors.push("lib/web/founder/mission_control/create_mission_dialog.dart does not exist.");
    } else {
        const createContent = fs.readFileSync(createDialogPath, 'utf8');
        if (!createContent.includes("student_mission_catalog")) {
            errors.push("lib/web/founder/mission_control/create_mission_dialog.dart does not mirror to student_mission_catalog.");
        } else {
            console.log("✅ Check 7: create_mission_dialog.dart still mirrors to student_mission_catalog.");
        }
    }

    // 8. edit_mission_dialog.dart still mirrors to student_mission_catalog
    const editDialogPath = path.join(__dirname, '../lib/web/founder/mission_control/edit_mission_dialog.dart');
    if (!fs.existsSync(editDialogPath)) {
        errors.push("lib/web/founder/mission_control/edit_mission_dialog.dart does not exist.");
    } else {
        const editContent = fs.readFileSync(editDialogPath, 'utf8');
        if (!editContent.includes("student_mission_catalog")) {
            errors.push("lib/web/founder/mission_control/edit_mission_dialog.dart does not mirror to student_mission_catalog.");
        } else {
            console.log("✅ Check 8: edit_mission_dialog.dart still mirrors to student_mission_catalog.");
        }
    }

    console.log("-----------------------------------------");
    if (errors.length > 0) {
        console.error("❌ BOUNDARY REGRESSION AUDIT FAILED!");
        errors.forEach(e => console.error(`- ${e}`));
        process.exit(1);
    } else {
        console.log("🎉 PATCH_W1B_BOUNDARY_AUDIT_PASSED");
        process.exit(0);
    }
}

main();

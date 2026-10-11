plugins {
    id("com.android.application")
    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    // END: FlutterFire Configuration
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.rankcrackers.app"
    compileSdk = 36
    buildToolsVersion = "36.0.0"
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.rankcrackers.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 24
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // Never store Android release signing credentials or keystore paths in Git.
    // Debug builds need no release secrets; release builds must fail closed.
    val releaseKeyAlias = providers.environmentVariable("RC_ANDROID_KEY_ALIAS").orNull
    val releaseKeyPassword = providers.environmentVariable("RC_ANDROID_KEY_PASSWORD").orNull
    val releaseStorePath = providers.environmentVariable("RC_ANDROID_STORE_FILE").orNull
    val releaseStorePassword = providers.environmentVariable("RC_ANDROID_STORE_PASSWORD").orNull
    val hasReleaseSigning = listOf(
        releaseKeyAlias, releaseKeyPassword, releaseStorePath, releaseStorePassword
    ).all { !it.isNullOrBlank() }
    val isReleaseInvocation = gradle.startParameter.taskNames.any {
        it.contains("Release", ignoreCase = true)
    }

    if (isReleaseInvocation && !hasReleaseSigning) {
        throw GradleException("RC_ANDROID_RELEASE_SIGNING_REQUIRED: configure all RC_ANDROID_* signing variables")
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                keyAlias = releaseKeyAlias!!
                keyPassword = releaseKeyPassword!!
                storeFile = file(releaseStorePath!!)
                storePassword = releaseStorePassword!!
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            // Do not silently sign a release with debug/default credentials.
            signingConfig = if (hasReleaseSigning) signingConfigs.getByName("release") else null
        }
        debug {
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

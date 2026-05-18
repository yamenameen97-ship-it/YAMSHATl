plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
}

val appBaseUrl = (project.findProperty("APP_BASE_URL") as String?) ?: "https://yamshatl.onrender.com/api/"
val socketUrl = (project.findProperty("APP_SOCKET_URL") as String?) ?: "https://yamshatl.onrender.com"
val agoraAppId = (project.findProperty("AGORA_APP_ID") as String?) ?: ""
val webAppUrl = (project.findProperty("WEB_APP_URL") as String?) ?: "https://yamshatl-11.onrender.com/"
val liveKitUrl = (project.findProperty("LIVEKIT_URL") as String?) ?: "wss://yamshat-enqr8c2d.livekit.cloud"
val primaryAdminEmail = (project.findProperty("PRIMARY_ADMIN_EMAIL") as String?) ?: "yamenameen97@gmail.com"

android {
    namespace = "com.socialapp"
    compileSdk = 34

    val hasCustomReleaseSigning =
        !(project.findProperty("RELEASE_STORE_FILE") as String?).isNullOrBlank() &&
            !(project.findProperty("RELEASE_STORE_PASSWORD") as String?).isNullOrBlank() &&
            !(project.findProperty("RELEASE_KEY_ALIAS") as String?).isNullOrBlank() &&
            !(project.findProperty("RELEASE_KEY_PASSWORD") as String?).isNullOrBlank()

    defaultConfig {
        applicationId = "com.socialapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 9
        versionName = "2.5.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField("String", "BASE_URL", "\"${appBaseUrl}\"")
        buildConfigField("String", "SOCKET_URL", "\"${socketUrl}\"")
        buildConfigField("String", "AGORA_APP_ID", "\"${agoraAppId}\"")
        buildConfigField("String", "WEB_APP_URL", "\"${webAppUrl}\"")
        buildConfigField("String", "LIVEKIT_URL", "\"${liveKitUrl}\"")
        buildConfigField("String", "PRIMARY_ADMIN_EMAIL", "\"${primaryAdminEmail}\"")
        buildConfigField("boolean", "ENABLE_SSL_PINNING", "true")
        buildConfigField("boolean", "ENFORCE_RUNTIME_SECURITY", "true")
    }

    signingConfigs {
        create("release") {
            val storeFilePath = project.findProperty("RELEASE_STORE_FILE") as String?
            val storePasswordValue = project.findProperty("RELEASE_STORE_PASSWORD") as String?
            val keyAliasValue = project.findProperty("RELEASE_KEY_ALIAS") as String?
            val keyPasswordValue = project.findProperty("RELEASE_KEY_PASSWORD") as String?

            if (!storeFilePath.isNullOrBlank()) {
                storeFile = file(storeFilePath)
                storePassword = storePasswordValue
                keyAlias = keyAliasValue
                keyPassword = keyPasswordValue
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            buildConfigField("boolean", "ENABLE_LOGS", "true")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            isDebuggable = false
            isJniDebuggable = false
            isPseudoLocalesEnabled = false
            buildConfigField("boolean", "ENABLE_LOGS", "false")
            signingConfig = if (hasCustomReleaseSigning) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.1")
    implementation("androidx.fragment:fragment-ktx:1.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("androidx.viewpager2:viewpager2:1.1.0")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("com.google.code.gson:gson:2.10.1")

    implementation(platform("com.google.firebase:firebase-bom:33.12.0"))
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-messaging")
    implementation("com.google.firebase:firebase-crashlytics-ktx")

    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    implementation("io.livekit:livekit-android:2.25.0")
    implementation("org.whispersystems:signal-protocol-android:2.8.1")
    implementation("io.socket:socket.io-client:2.1.1") {
        exclude(group = "org.json", module = "json")
    }
}

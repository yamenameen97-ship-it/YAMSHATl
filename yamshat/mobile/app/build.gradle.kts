plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.kapt")
}

val appBaseUrl = (project.findProperty("APP_BASE_URL") as String?) ?: "https://yamshatl.onrender.com/api/"
val socketUrl = (project.findProperty("APP_SOCKET_URL") as String?) ?: "https://yamshatl.onrender.com"
val agoraAppId = (project.findProperty("AGORA_APP_ID") as String?) ?: ""
val webAppUrl = (project.findProperty("WEB_APP_URL") as String?) ?: "https://yamshatl-11.onrender.com/"
val liveKitUrl = (project.findProperty("LIVEKIT_URL") as String?) ?: "wss://yamshat-enqr8c2d.livekit.cloud"
val streamUrl = (project.findProperty("STREAM_URL") as String?) ?: "https://yamshatl.onrender.com/stream"
val cdnUrl = (project.findProperty("CDN_URL") as String?) ?: "https://yamshatl.onrender.com/cdn"
val cdnProvider = (project.findProperty("CDN_PROVIDER") as String?) ?: "auto"
val cdnFetchTemplate = (project.findProperty("CDN_FETCH_TEMPLATE") as String?) ?: ""
val primaryAdminEmail = (project.findProperty("PRIMARY_ADMIN_EMAIL") as String?) ?: "yamenameen97@gmail.com"
val playIntegrityProjectNumber = (project.findProperty("PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER") as String?) ?: ""

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
        versionCode = 10
        versionName = "2.6.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField("String", "BASE_URL", "\"${appBaseUrl}\"")
        buildConfigField("String", "SOCKET_URL", "\"${socketUrl}\"")
        buildConfigField("String", "AGORA_APP_ID", "\"${agoraAppId}\"")
        buildConfigField("String", "WEB_APP_URL", "\"${webAppUrl}\"")
        buildConfigField("String", "LIVEKIT_URL", "\"${liveKitUrl}\"")
        buildConfigField("String", "STREAM_URL", "\"${streamUrl}\"")
        buildConfigField("String", "CDN_URL", "\"${cdnUrl}\"")
        buildConfigField("String", "CDN_PROVIDER", "\"${cdnProvider}\"")
        buildConfigField("String", "CDN_FETCH_TEMPLATE", "\"${cdnFetchTemplate}\"")
        buildConfigField("String", "PRIMARY_ADMIN_EMAIL", "\"${primaryAdminEmail}\"")
        buildConfigField("String", "PLAY_INTEGRITY_PROJECT_NUMBER", "\"${playIntegrityProjectNumber}\"")
        buildConfigField("boolean", "ENABLE_PLAY_INTEGRITY", "${if (playIntegrityProjectNumber.isNotBlank()) "true" else "false"}")
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
        create("staging") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("boolean", "ENABLE_LOGS", "true")
            buildConfigField("String", "BASE_URL", "\"https://staging.yamshatl.onrender.com/api/\"")
            buildConfigField("String", "SOCKET_URL", "\"https://staging.yamshatl.onrender.com\"")
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
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.compose.runtime:runtime-livedata")

    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    val media3Version = "1.4.1"
    implementation("androidx.media3:media3-exoplayer:$media3Version")
    implementation("androidx.media3:media3-exoplayer-hls:$media3Version")
    implementation("androidx.media3:media3-exoplayer-dash:$media3Version")
    implementation("androidx.media3:media3-ui:$media3Version")
    implementation("androidx.media3:media3-session:$media3Version")
    implementation("androidx.media3:media3-datasource:$media3Version")
    implementation("androidx.media3:media3-datasource-okhttp:$media3Version")
    implementation("androidx.media3:media3-database:$media3Version")

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
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    implementation(platform("com.google.firebase:firebase-bom:33.12.0"))
    implementation("com.google.firebase:firebase-analytics-ktx")
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-crashlytics-ktx")
    implementation("com.google.firebase:firebase-perf-ktx")
    implementation("com.google.android.play:integrity:1.4.0")
    implementation("com.android.billingclient:billing-ktx:7.1.1")

    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    kapt("com.github.bumptech.glide:compiler:4.16.0")

    val workVersion = "2.9.0"
    implementation("androidx.work:work-runtime-ktx:$workVersion")

    implementation("com.github.AbedElazizShehadeh:VideoCompressor:3.0.6")
    implementation("top.zibin:Luban:1.1.8")

    implementation("io.coil-kt:coil:2.6.0")
    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("io.coil-kt:coil-video:2.6.0")

    implementation("io.livekit:livekit-android:2.25.0")
    implementation("org.whispersystems:signal-protocol-android:2.8.1")
    implementation("io.socket:socket.io-client:2.1.1") {
        exclude(group = "org.json", module = "json")
    }

    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-android-compiler:2.51.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("org.mockito:mockito-core:5.12.0")
    testImplementation("org.mockito:mockito-inline:5.2.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.3.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.test:runner:1.6.1")
    androidTestImplementation("androidx.test:rules:1.6.1")
    androidTestImplementation("androidx.navigation:navigation-testing:2.7.0")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
    androidTestImplementation("org.mockito:mockito-android:5.12.0")
    androidTestImplementation("org.mockito.kotlin:mockito-kotlin:5.3.1")
}

kapt {
    correctErrorTypes = true
}

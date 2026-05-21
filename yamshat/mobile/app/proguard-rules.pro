# Keep model fields for Gson serialization while allowing obfuscation of names when possible.
-keepattributes Signature,*Annotation*,InnerClasses,EnclosingMethod,Exceptions
-renamesourcefileattribute SourceFile
-allowaccessmodification
-keepclassmembers class com.socialapp.models.** {
    <fields>;
}

# Networking / socket / crypto SDKs
-dontwarn javax.annotation.**
-dontwarn org.webrtc.**
-dontwarn okio.**
-keep class io.livekit.** { *; }
-keep class io.socket.** { *; }
-keep class org.whispersystems.libsignal.** { *; }
-keep class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Strip Android logs from release output for maximum security
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Advanced Obfuscation settings
-repackageclasses 'com.socialapp.internal'
-allowaccessmodification
-overloadaggressively
-useuniqueclassmembernames
-optimizationpasses 5

# String Obfuscation Support (Keep obfuscator if used)
-keep class com.socialapp.utils.StringObfuscator { *; }

# Protect critical security classes but obfuscate their contents
-keep,allowobfuscation class com.socialapp.utils.SecurityThreatDetector { *; }
-keep,allowobfuscation class com.socialapp.utils.CryptoManager { *; }

# Prevent reverse engineering of sensitive data structures
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Firebase messaging service entry point
-keep class com.socialapp.services.MyFirebaseService { *; }

# Preserve retrofit interface definitions
-keep interface com.socialapp.network.ApiService

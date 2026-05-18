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

# Strip Android logs from release output where possible
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Keep Firebase messaging service entry point
-keep class com.socialapp.services.MyFirebaseService { *; }

# Preserve retrofit interface definitions
-keep interface com.socialapp.network.ApiService

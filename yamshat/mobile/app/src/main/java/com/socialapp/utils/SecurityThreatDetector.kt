package com.socialapp.utils

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Debug
import android.provider.Settings
import com.socialapp.BuildConfig
import java.io.File
import java.net.InetSocketAddress
import java.net.Socket
import java.util.concurrent.TimeUnit

object SecurityThreatDetector {
    data class Threat(
        val code: String,
        val message: String,
    )

    @Volatile
    private var cachedThreat: Threat? = null

    fun detect(context: Context, forceRefresh: Boolean = false): Threat? {
        if (!forceRefresh) {
            cachedThreat?.let { return it }
        }
        val threat = detectInternal(context.applicationContext)
        if (threat != null) {
            cachedThreat = threat
        }
        return threat
    }

    private fun detectInternal(context: Context): Threat? {
        if (!BuildConfig.DEBUG && (Debug.isDebuggerConnected() || Debug.waitingForDebugger())) {
            return Threat(
                code = "debugger",
                message = "تم إيقاف التطبيق لحماية بياناتك بسبب رصد تصحيح أو تعديل غير مصرح به.",
            )
        }

        if (isFridaPresent()) {
            return Threat(
                code = "frida",
                message = "تم إيقاف التطبيق لحماية بياناتك بسبب رصد أدوات Frida أو حقن ديناميكي.",
            )
        }

        if (isXposedPresent(context)) {
            return Threat(
                code = "xposed",
                message = "تم إيقاف التطبيق لحماية بياناتك بسبب رصد Xposed / LSPosed أو بيئة تشغيل معدلة.",
            )
        }

        if (isRooted(context)) {
            return Threat(
                code = "root",
                message = "تم إيقاف التطبيق لأن الجهاز يبدو مروّت أو غير موثوق، وده ممكن يعرّض بياناتك للخطر.",
            )
        }

        if (!BuildConfig.DEBUG && isEmulator()) {
            return Threat(
                code = "emulator",
                message = "تم حظر التشغيل على بيئة افتراضية غير موثوقة لحماية الجلسة ومنع الأتمتة.",
            )
        }

        if (isAutomationToolInstalled(context) || isSuspiciousAccessibilityAutomationEnabled(context)) {
            return Threat(
                code = "automation",
                message = "تم رصد أدوات أتمتة أو نقر تلقائي على الجهاز، وتم إيقاف التطبيق لحماية الحساب.",
            )
        }

        return null
    }

    private fun isRooted(context: Context): Boolean {
        val tags = Build.TAGS.orEmpty()
        if (tags.contains("test-keys", ignoreCase = true)) return true

        val suspiciousPaths = listOf(
            "/system/app/Superuser.apk",
            "/system/bin/su",
            "/system/xbin/su",
            "/sbin/su",
            "/su/bin/su",
            "/system/bin/.ext/.su",
            "/system/usr/we-need-root/su",
            "/cache/su",
            "/data/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/data/local/su",
            "/system/framework/XposedBridge.jar",
            "/system/lib/libxposed_art.so",
            "/system/lib64/libxposed_art.so",
            "/sbin/magisk",
            "/data/adb/magisk",
            "/data/local/tmp/frida-server",
            "/data/local/tmp/re.frida.server",
            "/data/local/tmp/frida-gadget.so",
        )
        if (suspiciousPaths.any { path -> File(path).exists() }) return true

        val suspiciousPackages = listOf(
            "com.topjohnwu.magisk",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.yellowes.su",
            "com.kingroot.kinguser",
            "com.kingo.root",
            "com.saurik.substrate",
            "com.devadvance.rootcloak",
        )
        if (suspiciousPackages.any { pkg -> isPackageInstalled(context, pkg) }) return true

        return canRunShellCheck("which su")
    }

    private fun isXposedPresent(context: Context): Boolean {
        val xposedPackages = listOf(
            "de.robv.android.xposed.installer",
            "org.meowcat.edxposed.manager",
            "org.lsposed.manager",
            "com.android.tools.fd.runtime",
        )
        if (xposedPackages.any { pkg -> isPackageInstalled(context, pkg) }) return true

        if (File("/system/framework/XposedBridge.jar").exists()) return true

        val xposedClasses = listOf(
            "de.robv.android.xposed.XposedBridge",
            "de.robv.android.xposed.XC_MethodHook",
            "org.lsposed.lspd.impl.LSPosedContext",
        )
        if (xposedClasses.any { className -> classExists(className) }) return true

        return Throwable().stackTrace.any { element ->
            val className = element.className.lowercase()
            className.contains("xposed") || className.contains("lsposed") || className.contains("edxposed")
        }
    }

    private fun isFridaPresent(): Boolean {
        val suspiciousFiles = listOf(
            "/data/local/tmp/frida-server",
            "/data/local/tmp/re.frida.server",
            "/data/local/tmp/frida-gadget.so",
            "/dev/frida",
            "/dev/linjector",
        )
        if (suspiciousFiles.any { path -> File(path).exists() }) return true

        val mapsContent = runCatching { File("/proc/self/maps").readText() }.getOrDefault("").lowercase()
        if (
            mapsContent.contains("frida") ||
            mapsContent.contains("gum-js-loop") ||
            mapsContent.contains("gadget") ||
            mapsContent.contains("linjector") ||
            mapsContent.contains("gum-js")
        ) {
            return true
        }

        // Common Frida ports
        val fridaPorts = listOf(27042, 27043, 27047, 1337)
        if (fridaPorts.any { isLocalPortOpen(it) }) return true

        return checkNativeFridaSymbols()
    }

    private fun checkNativeFridaSymbols(): Boolean {
        // Advanced check: looking for frida specific symbols in memory
        return runCatching {
            val symbols = listOf("frida_agent_main", "gum_js_init", "frida_server_main")
            // This is a placeholder for JNI call if available, 
            // but we can check thread names as well
            val threads = Thread.getAllStackTraces().keys
            threads.any { it.name.lowercase().contains("frida") || it.name.lowercase().contains("gum-js") }
        }.getOrDefault(false)
    }

    private fun isEmulator(): Boolean {
        val buildInfo = listOf(
            Build.FINGERPRINT,
            Build.MODEL,
            Build.MANUFACTURER,
            Build.BRAND,
            Build.DEVICE,
            Build.PRODUCT,
            Build.HARDWARE,
            Build.BOARD,
            Build.BOOTLOADER
        ).joinToString(" ").lowercase()

        val knownEmulatorStrings = listOf(
            "generic", "sdk_gphone", "emulator", "genymotion", "goldfish", 
            "ranchu", "vbox", "nox", "bluestacks", "andy", "ttvm", "sdk_x86",
            "vbox86p", "qemu", "google_sdk", "droid4x"
        )

        if (knownEmulatorStrings.any { buildInfo.contains(it) }) return true
        
        // Advanced hardware checks
        if (Build.HARDWARE.lowercase().contains("goldfish") || 
            Build.HARDWARE.lowercase().contains("ranchu") ||
            Build.HARDWARE.lowercase().contains("vbox86")) return true
            
        // Check for common emulator files
        val emulatorFiles = listOf(
            "/dev/socket/qemud",
            "/dev/qemu_pipe",
            "/system/lib/libc_malloc_debug_qemu.so",
            "/sys/module/goldfish_setup",
            "/proc/irq/20/goldfish_pipe"
        )
        if (emulatorFiles.any { File(it).exists() }) return true

        return false
    }

    private fun isAutomationToolInstalled(context: Context): Boolean {
        val suspiciousPackages = listOf(
            "com.rise.automatic.autoclicker",
            "com.speed.gc.autoclicker",
            "simplehat.clicker",
            "com.autoclicker.clicker",
            "net.dinglisch.android.taskerm",
            "com.llamalab.automate",
            "com.macrorify.android",
            "io.appium.uiautomator2.server",
            "io.appium.settings",
        )
        return suspiciousPackages.any { pkg -> isPackageInstalled(context, pkg) }
    }

    private fun isSuspiciousAccessibilityAutomationEnabled(context: Context): Boolean {
        val enabledServices = runCatching {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
                .orEmpty()
                .lowercase()
        }.getOrDefault("")
        if (enabledServices.isBlank()) return false

        val suspiciousKeywords = listOf(
            "autoclick",
            "auto click",
            "macro",
            "tasker",
            "automate",
            "appium",
            "uiautomator",
            "click assistant",
            "screen click",
            "replay",
            "monkey",
        )
        return suspiciousKeywords.any { keyword -> enabledServices.contains(keyword) }
    }

    private fun canRunShellCheck(command: String): Boolean {
        return runCatching {
            val process = Runtime.getRuntime().exec(arrayOf("sh", "-c", command))
            val finished = process.waitFor(350, TimeUnit.MILLISECONDS)
            finished && process.exitValue() == 0
        }.getOrDefault(false)
    }

    private fun isLocalPortOpen(port: Int): Boolean {
        return runCatching {
            Socket().use { socket ->
                socket.connect(InetSocketAddress("127.0.0.1", port), 180)
                true
            }
        }.getOrDefault(false)
    }

    private fun classExists(className: String): Boolean {
        return runCatching {
            Class.forName(className)
            true
        }.getOrDefault(false)
    }

    private fun isPackageInstalled(context: Context, packageName: String): Boolean {
        return runCatching {
            val packageManager = context.packageManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(packageName, 0)
            }
            true
        }.getOrDefault(false)
    }
}

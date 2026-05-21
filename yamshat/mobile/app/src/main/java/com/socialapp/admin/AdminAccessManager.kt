package com.socialapp.admin

enum class UserRole {
    ADMIN,
    MODERATOR,
    USER,
}

enum class AppPermission {
    VIEW_ANALYTICS,
    MANAGE_REPORTS,
    MANAGE_BANS,
    MODERATE_CONTENT,
    MANAGE_USERS,
    SEND_MESSAGES,
    CREATE_POSTS,
}

data class RoleProfile(
    val role: UserRole,
    val permissions: Set<AppPermission>,
)

data class AnalyticsDashboardSnapshot(
    val activeUsers: Int,
    val postsToday: Int,
    val reportsOpen: Int,
    val liveStreams: Int,
)

data class ModerationPanelState(
    val pendingReports: Int,
    val blockedUsers: Int,
    val hiddenContent: Int,
)

object AdminAccessManager {
    fun resolve(role: String?, permissions: List<String>): RoleProfile {
        val normalizedRole = when (role?.trim()?.lowercase()) {
            "admin" -> UserRole.ADMIN
            "moderator", "mod" -> UserRole.MODERATOR
            else -> UserRole.USER
        }

        val roleDefaults = when (normalizedRole) {
            UserRole.ADMIN -> setOf(
                AppPermission.VIEW_ANALYTICS,
                AppPermission.MANAGE_REPORTS,
                AppPermission.MANAGE_BANS,
                AppPermission.MODERATE_CONTENT,
                AppPermission.MANAGE_USERS,
                AppPermission.SEND_MESSAGES,
                AppPermission.CREATE_POSTS,
            )
            UserRole.MODERATOR -> setOf(
                AppPermission.VIEW_ANALYTICS,
                AppPermission.MANAGE_REPORTS,
                AppPermission.MANAGE_BANS,
                AppPermission.MODERATE_CONTENT,
                AppPermission.SEND_MESSAGES,
                AppPermission.CREATE_POSTS,
            )
            UserRole.USER -> setOf(AppPermission.SEND_MESSAGES, AppPermission.CREATE_POSTS)
        }

        val explicit = permissions.mapNotNull { raw ->
            runCatching { AppPermission.valueOf(raw.trim().uppercase()) }.getOrNull()
        }.toSet()

        return RoleProfile(normalizedRole, roleDefaults + explicit)
    }

    fun canAccessDashboard(profile: RoleProfile): Boolean = profile.permissions.contains(AppPermission.VIEW_ANALYTICS)
    fun canModerate(profile: RoleProfile): Boolean = profile.permissions.contains(AppPermission.MODERATE_CONTENT)
}

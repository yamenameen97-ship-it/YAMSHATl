package com.socialapp.utils

import android.content.Context
import android.view.ContextThemeWrapper
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.AppCompatEditText
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.socialapp.R

object AppDialogs {
    fun builder(context: Context): AlertDialog.Builder {
        return MaterialAlertDialogBuilder(ContextThemeWrapper(context, R.style.ThemeOverlay_App_Dialog))
    }

    fun input(context: Context): AppCompatEditText {
        return AppCompatEditText(ContextThemeWrapper(context, R.style.ThemeOverlay_App_Dialog)).apply {
            UiKit.styleDialogInput(this)
        }
    }
}

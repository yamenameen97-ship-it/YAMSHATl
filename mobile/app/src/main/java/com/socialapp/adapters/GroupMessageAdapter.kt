package com.socialapp.adapters

import android.content.Intent
import android.net.Uri
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.databinding.ItemGroupMessageBinding
import com.socialapp.models.GroupMessage
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class GroupMessageAdapter(
    private val messages: MutableList<GroupMessage>,
    private val currentUser: String,
    private val onLongClick: (GroupMessage) -> Unit = {},
    private val onReactionClick: (GroupMessage, String) -> Unit = { _, _ -> }
) : RecyclerView.Adapter<GroupMessageAdapter.ViewHolder>() {

    inner class ViewHolder(private val binding: ItemGroupMessageBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(message: GroupMessage) {
            message.isOwn = message.senderUsername == currentUser

            binding.senderName.text = message.senderDisplayName.ifBlank { message.senderUsername }
            binding.senderName.visibility = if (message.isOwn) android.view.View.GONE else android.view.View.VISIBLE

            val displayText = when {
                message.isDeleted -> "تم حذف هذه الرسالة"
                message.displayMessage.isNotEmpty() -> message.displayMessage
                else -> message.content
            }

            binding.messageText.text = displayText
            binding.messageText.visibility = if (displayText.isNotEmpty() && message.messageType == "text") android.view.View.VISIBLE else android.view.View.GONE

            when (message.messageType) {
                "image" -> {
                    binding.mediaPreview.visibility = android.view.View.VISIBLE
                    binding.actionBtn.visibility = android.view.View.GONE
                    Glide.with(binding.root.context)
                        .load(message.mediaUrl)
                        .diskCacheStrategy(DiskCacheStrategy.NONE)
                        .centerCrop()
                        .into(binding.mediaPreview)
                }
                "video", "voice", "file" -> {
                    binding.mediaPreview.visibility = android.view.View.GONE
                    binding.actionBtn.visibility = android.view.View.VISIBLE
                    binding.actionBtn.text = when (message.messageType) {
                        "video" -> "▶ فيديو"
                        "voice" -> "🔊 صوتي"
                        else -> "📎 ملف"
                    }
                    binding.actionBtn.setOnClickListener {
                        message.mediaUrl?.takeIf { url -> url.isNotBlank() }?.let { url ->
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            binding.root.context.startActivity(intent)
                        }
                    }
                }
                else -> {
                    binding.mediaPreview.visibility = android.view.View.GONE
                    binding.actionBtn.visibility = android.view.View.GONE
                }
            }

            val timeStr = try {
                val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val parsed = parser.parse(message.createdAt)
                SimpleDateFormat("HH:mm", Locale("ar")).format(parsed ?: Date())
            } catch (_: Exception) {
                message.createdAt.take(16)
            }

            binding.metaText.text = buildString {
                append(timeStr)
                if (message.isOwn) {
                    append(" • ")
                    append(
                        when (message.status.lowercase()) {
                            "sending" -> "… جارٍ الإرسال"
                            "pending" -> "⏳ بانتظار الشبكة"
                            "failed" -> "⚠️ فشل الإرسال"
                            "delivered" -> "✓✓"
                            "seen" -> "✓✓"
                            else -> "✓"
                        }
                    )
                }
            }

            val params = binding.bubbleRoot.layoutParams as ViewGroup.MarginLayoutParams
            if (message.isOwn) {
                params.marginStart = 80
                params.marginEnd = 12
                binding.bubbleRoot.setBackgroundColor(binding.root.context.getColor(android.R.color.holo_blue_light))
            } else {
                params.marginStart = 12
                params.marginEnd = 80
                binding.bubbleRoot.setBackgroundColor(binding.root.context.getColor(android.R.color.darker_gray))
            }
            binding.bubbleRoot.layoutParams = params

            if (message.reactions.isNotEmpty()) {
                binding.reactionsContainer.visibility = android.view.View.VISIBLE
                binding.reactionsContainer.removeAllViews()
                message.reactions.forEach { (emoji, users) ->
                    val reactionView = android.widget.Button(binding.root.context).apply {
                        text = "$emoji ${users.size}"
                        textSize = 10f
                        setPadding(8, 4, 8, 4)
                        setOnClickListener { onReactionClick(message, emoji) }
                    }
                    binding.reactionsContainer.addView(reactionView)
                }
            } else {
                binding.reactionsContainer.visibility = android.view.View.GONE
            }

            binding.root.setOnLongClickListener {
                if (!message.isDeleted && message.isOwn && message.status.lowercase() !in setOf("sending", "pending")) {
                    onLongClick(message)
                }
                true
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemGroupMessageBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(messages[position])
    }

    override fun getItemCount() = messages.size

    fun submitItems(newMessages: List<GroupMessage>) {
        messages.clear()
        messages.addAll(newMessages)
        notifyDataSetChanged()
    }

    fun addMessage(message: GroupMessage) {
        messages.add(message)
        notifyItemInserted(messages.lastIndex)
    }

    fun currentItems(): List<GroupMessage> = messages.toList()
}

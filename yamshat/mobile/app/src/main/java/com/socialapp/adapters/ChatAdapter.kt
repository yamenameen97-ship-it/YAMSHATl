package com.socialapp.adapters

import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.R
import com.socialapp.databinding.ItemChatBinding
import com.socialapp.models.MessageItem
import java.util.Locale

class ChatAdapter(
    private val list: MutableList<MessageItem>,
    private val currentUser: String,
    private val onMessageLongPress: (MessageItem) -> Unit,
) : RecyclerView.Adapter<ChatAdapter.VH>() {

    class VH(val binding: ItemChatBinding) : RecyclerView.ViewHolder(binding.root)

    private var mediaPlayer: MediaPlayer? = null
    private var activeVoiceKey: String? = null

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemChatBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val msg = list[position]
        val context = holder.binding.root.context
        val isMine = msg.sender == currentUser
        val displayText = when {
            msg.deleted == true -> "تم حذف هذه الرسالة"
            !msg.displayMessage.isNullOrBlank() -> msg.displayMessage
            !msg.content.isNullOrBlank() -> msg.content
            else -> msg.message
        }

        holder.binding.text1.text = displayText
        holder.binding.text1.visibility = if (displayText.isBlank() || msg.type == "voice") View.GONE else View.VISIBLE
        holder.binding.metaText.text = buildMetaText(msg, isMine)

        val params = holder.binding.bubbleRoot.layoutParams as FrameLayout.LayoutParams
        params.gravity = if (isMine) Gravity.END else Gravity.START
        holder.binding.bubbleRoot.layoutParams = params
        holder.binding.bubbleRoot.setBackgroundResource(if (isMine) R.drawable.msg_sent else R.drawable.msg_received)
        holder.binding.text1.setTextColor(ContextCompat.getColor(context, R.color.text_primary))
        holder.binding.metaText.setTextColor(ContextCompat.getColor(context, if (isMine) R.color.white else R.color.text_secondary))

        bindReply(holder, msg)
        bindMedia(holder, msg)
        bindReactions(holder, msg)

        holder.binding.root.setOnLongClickListener {
            if (msg.deleted == true) {
                false
            } else {
                onMessageLongPress(msg)
                true
            }
        }
    }

    private fun bindReply(holder: VH, msg: MessageItem) {
        val replyText = msg.reply_to_message.orEmpty().trim()
        if (replyText.isBlank()) {
            holder.binding.replyContainer.visibility = View.GONE
            return
        }
        holder.binding.replyContainer.visibility = View.VISIBLE
        holder.binding.replySenderText.text = msg.reply_to_sender?.ifBlank { "رسالة سابقة" } ?: "رسالة سابقة"
        holder.binding.replyMessageText.text = replyText
    }

    private fun bindMedia(holder: VH, msg: MessageItem) {
        val context = holder.binding.root.context
        val mediaUrl = msg.media_url.orEmpty()
        holder.binding.mediaPreview.visibility = View.GONE
        holder.binding.actionBtn.visibility = View.GONE
        holder.binding.voiceContainer.visibility = View.GONE
        holder.binding.actionBtn.setOnClickListener(null)
        holder.binding.mediaPreview.setOnClickListener(null)
        holder.binding.playVoiceBtn.setOnClickListener(null)
        holder.binding.waveformView.setProgress(if (msg.localStableKey() == activeVoiceKey) 0.55f else 0f)
        holder.binding.waveformView.setSeed(msg.localStableKey().hashCode())

        if (msg.deleted == true) return

        when {
            (msg.type == "image" || mediaUrl.matches(Regex(".*\\.(png|jpg|jpeg|webp|gif)$", RegexOption.IGNORE_CASE))) && mediaUrl.isNotBlank() -> {
                holder.binding.mediaPreview.visibility = View.VISIBLE
                Glide.with(context)
                    .load(mediaUrl)
                    .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
                    .centerCrop()
                    .into(holder.binding.mediaPreview)
                holder.binding.mediaPreview.setOnClickListener {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(mediaUrl)))
                }
            }
            msg.type == "voice" && mediaUrl.isNotBlank() -> {
                holder.binding.voiceContainer.visibility = View.VISIBLE
                holder.binding.voiceDurationText.text = formatDuration(msg.voice_duration_ms ?: 0L)
                val isPlaying = msg.localStableKey() == activeVoiceKey
                holder.binding.playVoiceBtn.setImageResource(
                    if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
                )
                holder.binding.playVoiceBtn.setOnClickListener {
                    toggleVoice(msg)
                }
            }
            mediaUrl.isNotBlank() -> {
                holder.binding.actionBtn.visibility = View.VISIBLE
                holder.binding.actionBtn.text = when (msg.type) {
                    "video" -> "فتح الفيديو"
                    else -> "فتح الملف"
                }
                holder.binding.actionBtn.setOnClickListener {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(mediaUrl)))
                }
            }
        }
    }

    private fun bindReactions(holder: VH, msg: MessageItem) {
        val reactions = msg.reactions.filterValues { it > 0 }
        if (reactions.isEmpty()) {
            holder.binding.reactionsContainer.visibility = View.GONE
            holder.binding.reactionsContainer.removeAllViews()
            return
        }
        holder.binding.reactionsContainer.visibility = View.VISIBLE
        holder.binding.reactionsContainer.removeAllViews()
        reactions.entries.sortedByDescending { it.value }.forEach { (emoji, count) ->
            val chip = TextView(holder.binding.root.context).apply {
                text = "$emoji $count"
                textSize = 11f
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                setPadding(18, 10, 18, 10)
                background = ContextCompat.getDrawable(context, R.drawable.bg_input)
            }
            val lp = ViewGroup.MarginLayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            lp.marginEnd = 8
            holder.binding.reactionsContainer.addView(chip, lp)
        }
    }

    private fun toggleVoice(msg: MessageItem) {
        val url = msg.media_url.orEmpty()
        if (url.isBlank()) return
        val key = msg.localStableKey()
        if (activeVoiceKey == key) {
            stopVoicePlayback()
            notifyDataSetChanged()
            return
        }
        stopVoicePlayback()
        mediaPlayer = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            )
            setDataSource(url)
            setOnPreparedListener {
                activeVoiceKey = key
                start()
                notifyDataSetChanged()
            }
            setOnCompletionListener {
                stopVoicePlayback()
                notifyDataSetChanged()
            }
            prepareAsync()
        }
    }

    private fun stopVoicePlayback() {
        runCatching { mediaPlayer?.stop() }
        runCatching { mediaPlayer?.reset() }
        runCatching { mediaPlayer?.release() }
        mediaPlayer = null
        activeVoiceKey = null
    }

    private fun buildMetaText(msg: MessageItem, isMine: Boolean): String {
        return buildString {
            append(msg.created_at?.replace('T', ' ')?.take(16) ?: "الآن")
            if (msg.edited_at != null) {
                append("  •  معدلة")
            }
            if (isMine) {
                append("  •  ")
                append(
                    when ((msg.status ?: "sent").lowercase(Locale.ROOT)) {
                        "sending" -> "Sent…"
                        "pending" -> "Sent لاحقاً"
                        "failed" -> "⚠️ فشل"
                        "seen" -> "Seen ✓✓"
                        "delivered" -> "Delivered ✓✓"
                        "deleted" -> "تم الحذف"
                        else -> "Sent ✓"
                    }
                )
            }
        }
    }

    private fun formatDuration(durationMs: Long): String {
        if (durationMs <= 0L) return "--:--"
        val totalSeconds = durationMs / 1000
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return String.format(Locale.US, "%02d:%02d", minutes, seconds)
    }

    override fun getItemCount() = list.size

    fun submitItems(items: List<MessageItem>) {
        stopVoicePlayback()
        list.clear()
        list.addAll(items)
        notifyDataSetChanged()
    }

    fun appendItem(item: MessageItem) {
        list.add(item)
        notifyItemInserted(list.lastIndex)
    }

    fun replaceItem(updated: MessageItem) {
        val index = list.indexOfFirst { it.localStableKey() == updated.localStableKey() || (updated.id != null && it.id == updated.id) }
        if (index >= 0) {
            list[index] = updated
            notifyItemChanged(index)
        }
    }

    fun currentItems(): List<MessageItem> = list.toList()

    fun release() {
        stopVoicePlayback()
    }
}

package com.socialapp.adapters

import android.content.Intent
import android.net.Uri
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.R
import com.socialapp.databinding.ItemChatBinding
import com.socialapp.models.MessageItem

class ChatAdapter(
    private val list: MutableList<MessageItem>,
    private val currentUser: String,
    private val onOwnMessageLongPress: (MessageItem) -> Unit
) : RecyclerView.Adapter<ChatAdapter.VH>() {

    class VH(val binding: ItemChatBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemChatBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val msg = list[position]
        val context = holder.binding.root.context
        val isMine = msg.sender == currentUser
        val displayText = msg.displayMessage ?: msg.content ?: msg.message
        holder.binding.text1.text = displayText
        holder.binding.metaText.text = buildString {
            append(msg.created_at?.replace('T', ' ')?.take(16) ?: "الآن")
            if (msg.edited_at != null) {
                append("  •  معدلة")
            }
            if (isMine) {
                append("  •  ")
                append(
                    when ((msg.status ?: "sent").lowercase()) {
                        "sending" -> "… جارٍ الإرسال"
                        "pending" -> "⏳ بانتظار الشبكة"
                        "failed" -> "⚠️ فشل الإرسال"
                        "seen" -> "✓✓ تمت المشاهدة"
                        "delivered" -> "✓✓ تم التسليم"
                        "deleted" -> "تم الحذف"
                        else -> "✓ تم الإرسال"
                    }
                )
            }
        }

        val params = holder.binding.bubbleRoot.layoutParams as FrameLayout.LayoutParams
        params.gravity = if (isMine) Gravity.END else Gravity.START
        holder.binding.bubbleRoot.layoutParams = params
        holder.binding.bubbleRoot.setBackgroundResource(if (isMine) R.drawable.msg_sent else R.drawable.msg_received)
        holder.binding.text1.setTextColor(context.getColor(R.color.text_primary))
        holder.binding.metaText.setTextColor(context.getColor(if (isMine) R.color.white else R.color.text_secondary))

        holder.binding.mediaPreview.visibility = View.GONE
        holder.binding.actionBtn.visibility = View.GONE
        holder.binding.actionBtn.setOnClickListener(null)

        val mediaUrl = msg.media_url.orEmpty()
        when {
            msg.deleted == true -> Unit
            (msg.type == "image" || mediaUrl.matches(Regex(".*\\.(png|jpg|jpeg|webp|gif)$", RegexOption.IGNORE_CASE))) && mediaUrl.isNotBlank() -> {
                holder.binding.mediaPreview.visibility = View.VISIBLE
                Glide.with(context)
                    .load(mediaUrl)
                    .diskCacheStrategy(DiskCacheStrategy.NONE)
                    .centerCrop()
                    .into(holder.binding.mediaPreview)
            }
            mediaUrl.isNotBlank() -> {
                holder.binding.actionBtn.visibility = View.VISIBLE
                holder.binding.actionBtn.text = when (msg.type) {
                    "voice" -> "تشغيل الصوت"
                    "video" -> "فتح الفيديو"
                    else -> "فتح الملف"
                }
                holder.binding.actionBtn.setOnClickListener {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(mediaUrl))
                    context.startActivity(intent)
                }
            }
        }

        holder.binding.root.setOnLongClickListener {
            if (isMine && msg.deleted != true && (msg.status ?: "").lowercase() !in setOf("sending", "pending")) {
                onOwnMessageLongPress(msg)
                true
            } else {
                false
            }
        }
    }

    override fun getItemCount() = list.size

    fun submitItems(items: List<MessageItem>) {
        list.clear()
        list.addAll(items)
        notifyDataSetChanged()
    }

    fun appendItem(item: MessageItem) {
        list.add(item)
        notifyItemInserted(list.lastIndex)
    }

    fun currentItems(): List<MessageItem> = list.toList()
}

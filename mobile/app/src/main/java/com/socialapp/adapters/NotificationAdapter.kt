package com.socialapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.socialapp.databinding.NotificationItemBinding
import com.socialapp.models.NotificationItem

class NotificationAdapter(
    private val list: List<NotificationItem>,
    private val onItemClick: (NotificationItem) -> Unit,
) : RecyclerView.Adapter<NotificationAdapter.VH>() {

    class VH(val binding: NotificationItemBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = NotificationItemBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = list[position]
        holder.binding.msg.text = item.message
        holder.binding.meta.text = buildString {
            append(item.created_at?.replace('T', ' ')?.take(16) ?: "")
            if (!item.read && item.seen == 0) append("  •  جديد")
        }
        holder.binding.root.alpha = if (!item.read && item.seen == 0) 1f else 0.78f
        holder.binding.root.setOnClickListener { onItemClick(item) }
    }

    override fun getItemCount() = list.size
}
